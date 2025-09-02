"use client";
import { useRef, useState, useEffect } from "react";
import { 
  Pencil, Eraser, StickyNote, ImagePlus, ZoomIn, ZoomOut, Trash2, ArrowLeft
} from "lucide-react";
import { Canvas as FabricCanvas, Rect, Textbox, Image as FabricImage, Group, Path as FabricPath } from "fabric";
import * as fabricNS from "fabric";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";


// Helper to read design tokens (HSL) from CSS variables and return usable CSS color strings
function token(name: string) {
  const val = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  return val ? `hsl(${val})` : undefined;
}

const TOOLBAR_HEIGHT = 88; // keep some space for a comfy fixed toolbar

export type Tool = "select" | "hand" | "draw" | "eraser";

export default function Jamboard() {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const isDraggingRef = useRef(false);
  const search = useSearchParams();
  const pinboardId = search.get("pinboardId") || "";
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // default color for new notes; can be changed from swatches
  const [noteColor, setNoteColor] = useState<string>("#FEF9C3");
  
  // Apply a consistent, modern look to Fabric controls per object
  const applyControlsTheme = (obj: any) => {
    try {
      obj.set({
        transparentCorners: false,
        cornerStyle: 'circle',
        cornerColor: '#111827', // slate-900
        cornerStrokeColor: '#ffffff',
        cornerSize: 12,
        borderColor: '#111827',
        padding: 6,
        rotatingPointOffset: 24,
      });
    } catch {}
  };

  // Function to resize note rectangle based on text content
  const resizeNoteToText = (group: Group) => {
    const objects = group.getObjects();
    const rect = objects.find(obj => obj.type === 'rect') as Rect;
    const textbox = objects.find(obj => obj.type === 'textbox') as Textbox;
    
    if (!rect || !textbox) return;
    
    // Calculate required height based on text content
    const minHeight = 180; // Minimum note height
    const padding = 24; // Top and bottom padding
    const textHeight = (textbox as any).calcTextHeight?.() || (textbox as any).height || 0;
    const requiredHeight = Math.max(minHeight, textHeight + padding);
    
    // Update rectangle dimensions
    rect.set({ height: requiredHeight });
    
    // Keep textbox positioned at top-left of the rectangle
    const rectWidth = rect.width || 180;
    textbox.set({
      left: -rectWidth / 2 + 12,
      top: -requiredHeight / 2 + 12,
      width: rectWidth - 24
    });
    
    group.setCoords();
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Modernize Fabric selection/resize UI (global)
    try {
      (fabricNS as any).Object.prototype.transparentCorners = false;
      (fabricNS as any).Object.prototype.cornerStyle = 'circle';
      (fabricNS as any).Object.prototype.cornerColor = '#111827'; // slate-900
      (fabricNS as any).Object.prototype.cornerStrokeColor = '#ffffff';
      (fabricNS as any).Object.prototype.cornerSize = 12;
      (fabricNS as any).Object.prototype.borderColor = '#111827';
      (fabricNS as any).Object.prototype.borderScaleFactor = 2;
      (fabricNS as any).Object.prototype.selectionBackgroundColor = 'rgba(15,23,42,0.05)';
      (fabricNS as any).Object.prototype.padding = 6;
      (fabricNS as any).Object.prototype.rotatingPointOffset = 24;
    } catch {}

    const computeSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight - TOOLBAR_HEIGHT;
      return { w, h };
    };

    const { w, h } = computeSize();
    const canvas = new FabricCanvas(canvasRef.current, {
      width: w,
      height: h,
      backgroundColor: 'transparent',
      selection: true,
      subTargetCheck: true,
    });
    // Canvas selection cosmetics
    (canvas as any).selectionColor = 'rgba(15,23,42,0.06)';
    (canvas as any).selectionBorderColor = '#111827';
    (canvas as any).selectionLineWidth = 1.25;

    // Drawing brush will be configured when entering draw mode

    // Wheel: zoom with ctrl/cmd, otherwise pan (infinite scroll feel)
    const wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      const point = { x: e.offsetX, y: e.offsetY } as any;

      if (e.ctrlKey || e.metaKey) {
        const zoom = canvas.getZoom();
        const delta = -e.deltaY;
        const zoomFactor = 1 + (delta > 0 ? 0.1 : -0.1);
        let newZoom = zoom * zoomFactor;
        newZoom = Math.max(0.2, Math.min(5, newZoom));
        canvas.zoomToPoint(point, newZoom);
        canvas.requestRenderAll();
        return;
      }

      // Pan using Fabric API so controls remain in sync
      const panPoint = new (fabricNS as any).Point(-e.deltaX, -e.deltaY);
      canvas.relativePan(panPoint);
      canvas.requestRenderAll();
    };

    // Mouse drag panning when in "hand" tool
    const onMouseDown = (opt: any) => {
      if (activeTool !== "hand") return;
      isDraggingRef.current = true;
      canvas.setCursor("grabbing");
    };

    const onMouseMove = (opt: any) => {
      if (!isDraggingRef.current) return;
      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform;
      if (!vpt) return;
      vpt[4] += evt.movementX;
      vpt[5] += evt.movementY;
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      canvas.setCursor("default");
    };

    // Enable editing textbox inside a note on double-click
    const onDbl = (opt: any) => {
      const target = opt?.target;
      if (!target) return;
      let group = target as any;
      if (group.type !== 'group' && (group.group as any)?.type === 'group') {
        group = group.group;
      }
      if (group.type === 'group') {
        const tb = (group as Group).getObjects().find((o: any) => o.type === 'textbox') as any;
        if (tb) {
          // Clear placeholder text when editing begins
          if ((tb as any)._isPlaceholder) {
            tb.set('text', '');
            tb.set('fill', token('foreground') || '#111111');
            (tb as any)._isPlaceholder = false;
          }
          canvas.setActiveObject(tb);
          tb.enterEditing();
          tb.hiddenTextarea?.focus?.();
          canvas.requestRenderAll();
        }
      }
    };

    // Attach listeners
    const upper = canvas.upperCanvasEl as HTMLCanvasElement;
    upper.addEventListener("wheel", wheelListener, { passive: false });
    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);
    canvas.on('mouse:dblclick', onDbl);
    canvas.on('object:added', (evt: any) => { if (evt?.target) applyControlsTheme(evt.target); });
    
    // Handle placeholder text when editing ends
    const onTextEditingEnd = (evt: any) => {
      const tb = evt.target;
      if (tb && tb.type === 'textbox') {
        // Find the parent group
        let group = tb.group;
        if (group && group.type === 'group' && (group as any).data?.type === 'note') {
          resizeNoteToText(group as Group);
        }
        
        if (!tb.text || tb.text.trim() === '') {
          // Restore placeholder if text is empty
          (tb as any)._isPlaceholder = true;
          tb.set('text', (tb as any)._placeholder || 'Write your idea...');
          tb.set('fill', '#9ca3af'); // gray-400 for placeholder
          canvas.requestRenderAll();
        } else {
          // Ensure normal text color
          (tb as any)._isPlaceholder = false;
          tb.set('fill', token('foreground') || '#111111');
        }
        
        canvas.requestRenderAll();
        saveNotesDebounced();
      }
    };
    canvas.on('text:editing:exited', onTextEditingEnd);
    
     // Handle text changes during editing for real-time resizing
    const onTextChanged = (evt: any) => {
      const tb = evt.target;
      if (tb && tb.type === 'textbox') {
        let group = tb.group;
        if (group && group.type === 'group' && (group as any).data?.type === 'note') {
          resizeNoteToText(group as Group);
          canvas.requestRenderAll();
        }
      }
    };
    canvas.on('text:changed', onTextChanged);
    // Tag drawing paths when created - moved to after function definition
    const onPathCreated = (evt: any) => {
      console.log("onPathCreated event triggered:", evt);
      const p = evt?.path as any;
      if (p) {
        console.log("Path object created:", p);
        const strokeId = `draw_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
        p.data = { type: 'drawing', id: strokeId };
        p.erasable = true;
        
        console.log("About to save stroke:", strokeId);
        // Save stroke immediately (Figma-style)
        if (typeof saveStrokeImmediately === 'function') {
          saveStrokeImmediately(p, strokeId);
        } else {
          console.log("saveStrokeImmediately function not available yet");
          // Fallback to debounced save
          saveNotesDebounced();
        }
      } else {
        console.log("No path object in event:", evt);
      }
    };

    setFabricCanvas(canvas);

    // Try loading saved notes
    const loadFromFirestore = async () => {
      if (!pinboardId || isLoaded)return;
      try {
        const pinboardRef = doc(db, "pinboards", pinboardId);
        const snap = await getDoc(pinboardRef);
        if (snap.exists()) {
          const data: any = snap.data();
          const saved = data?.pinboard?.notes as any[] | undefined;
          if (Array.isArray(saved)) {
            for (const n of saved) {
              const w = Math.max(60, n.width ?? 180);
              const h = Math.max(60, n.height ?? 180);
              // Children are positioned relative to group center to preserve layout on reload
              const rect = new Rect({
                left: 0,
                top: 0,
                originX: 'center',
                originY: 'center',
                width: w,
                height: h,
                rx: 0,
                ry: 0,
                fill: n.fill || noteColor,
                stroke: n.stroke || (token('border') || '#e5e7eb'),
              });
              const tb = new Textbox(n.text || '', {
                left: -w / 2 + 12,
                top: -h / 2 + 12,
                originX: 'left',
                originY: 'top',
                width: w - 24,
                fontSize: 18,
                fill: token('foreground') || '#111111',
                editable: true,
                splitByGrapheme: true, // Changed to false for proper word wrapping
                lineHeight: 1.4,
                dynamicMinWidth: w - 24,
              });
              
              // Set up placeholder behavior for loaded notes
              (tb as any)._placeholder = "Write your idea...";
              if (!n.text || n.text.trim() === '') {
                (tb as any)._isPlaceholder = true;
                tb.set('text', 'Write your idea...');
                tb.set('fill', '#9ca3af'); // gray-400 for placeholder
              } else {
                (tb as any)._isPlaceholder = false;
              }
              const group = new Group([rect, tb], { left: n.left ?? 0, top: n.top ?? 0 });
              applyControlsTheme(group);
              (group as any).data = { type: 'note', id: n.id || `note_${Date.now()}_${Math.random().toString(36).slice(2,6)}` };
              (group as any).erasable = false;
              canvas.add(group);
            }
            canvas.requestRenderAll();
          }
          const images = data?.pinboard?.images as any[] | undefined;
          if (Array.isArray(images)) {
            for (const im of images) {
              // @ts-ignore promise signature
              await FabricImage.fromURL(im.src).then((img: any) => {
                img.set({
                  left: im.left ?? 0,
                  top: im.top ?? 0,
                  scaleX: im.scaleX ?? 1,
                  scaleY: im.scaleY ?? 1,
                  angle: im.angle ?? 0,
                });
                applyControlsTheme(img);
                (img as any).data = { type: 'image', id: im.id, src: im.src };
                canvas.add(img);
              });
            }
            canvas.requestRenderAll();
          }
          const drawings = data?.pinboard?.drawings as any[] | undefined;
          if (Array.isArray(drawings)) {
            for (const d of drawings) {
              try {
                // Handle new path format (Figma-style)
                if (d.path) {
                  const path = new (fabricNS as any).Path(d.path, {
                    left: d.left || 0,
                    top: d.top || 0,
                    stroke: d.stroke || '#111111',
                    strokeWidth: d.strokeWidth || 3,
                    fill: d.fill || 'transparent',
                  });
                  path.data = { type: 'drawing', id: d.id };
                  path.erasable = true;
                  canvas.add(path);
                } else if (d.svg && (fabricNS as any).loadSVGFromString) {
                  // Legacy SVG format support
                  (fabricNS as any).loadSVGFromString(d.svg).then(({ objects, options }: any) => {
                    const grouped = (fabricNS as any).util.groupSVGElements(objects || [], options || {});
                    const obj = grouped || objects?.[0];
                    if (!obj) return;
                    obj.set({
                      left: d.left ?? 0,
                      top: d.top ?? 0,
                      scaleX: d.scaleX ?? 1,
                      scaleY: d.scaleY ?? 1,
                      angle: d.angle ?? 0,
                    });
                    applyControlsTheme(obj);
                    obj.data = { type: 'drawing', id: d.id };
                    obj.erasable = true;
                    canvas.add(obj);
                    canvas.requestRenderAll();
                  }).catch(() => {});
                }
              } catch {}
            }
            canvas.requestRenderAll();
          }
        }
        setIsLoaded(true);
      } catch (err) {
        console.error("Load pinboard notes error", err);
        setIsLoaded(true);
      }
    };
    loadFromFirestore();

    const onResize = () => {
      const { w, h } = computeSize();
      canvas.setDimensions({ width: w, height: h });
      canvas.requestRenderAll();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      upper.removeEventListener("wheel", wheelListener as any);
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:move", onMouseMove);
      canvas.off("mouse:up", onMouseUp);
      canvas.off('mouse:dblclick', onDbl);
      canvas.off('text:editing:exited', onTextEditingEnd);
      canvas.off('text:changed', onTextChanged);
      canvas.off('path:created', onPathCreated);
      canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle modes based on active tool (draw/eraser)
  useEffect(() => {
    if (!fabricCanvas) return;
    console.log("Setting up drawing mode, activeTool:", activeTool);
    
    const isDraw = activeTool === 'draw';
    const isErase = activeTool === 'eraser';
    fabricCanvas.isDrawingMode = isDraw || isErase;
    fabricCanvas.selection = !(isDraw || isErase);
    
    console.log("Drawing mode settings:", {
      isDrawingMode: fabricCanvas.isDrawingMode,
      selection: fabricCanvas.selection,
      isDraw,
      isErase
    });
    
    if (isDraw) {
      const brush = new (fabricNS as any).PencilBrush(fabricCanvas);
      brush.width = 3;
      brush.color = token('foreground') || '#111111';
      fabricCanvas.freeDrawingBrush = brush;
      console.log("Pencil brush configured:", brush);
    } else if (isErase) {
      const EB = (fabricNS as any).EraserBrush;
      if (EB) {
        const ebrush = new EB(fabricCanvas);
        ebrush.width = 12;
        fabricCanvas.freeDrawingBrush = ebrush;
        console.log("Eraser brush configured:", ebrush);
      } else {
        fabricCanvas.isDrawingMode = false;
        console.log("EraserBrush not available");
      }
    }
  }, [activeTool, fabricCanvas]);

  const getCanvasCenter = () => {
    if (!fabricCanvas) return { x: 0, y: 0 };
    const zoom = fabricCanvas.getZoom();
    const vpt = fabricCanvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const w = fabricCanvas.getWidth();
    const h = fabricCanvas.getHeight();
    const cx = (w / 2 - vpt[4]) / zoom;
    const cy = (h / 2 - vpt[5]) / zoom;
    return { x: cx, y: cy };
  };

  const addStickyNote = () => {
    if (!fabricCanvas) return;
    const { x, y } = getCanvasCenter();

    const noteSize = 180;
    const fill = noteColor || token("accent") || "#FEF9C3";
    const stroke = token("border") || "#e5e7eb";
    const textColor = token("foreground") || "#111111";

    const rect = new Rect({ // rectangular, centered
      left: 0,
      top: 0,
      originX: 'center',
      originY: 'center',
      width: noteSize,
      height: noteSize,
      rx: 0,
      ry: 0,
      fill,
      stroke,
    });

    const tb = new Textbox("", {
      left: -noteSize / 2 + 12,
      top: -noteSize / 2 + 12,
      originX: 'left',
      originY: 'top',
      width: noteSize - 24,
      fontSize: 18,
      fill: textColor,
      editable: true,
      splitByGrapheme: true, // Changed to false for proper word wrapping
      cursorColor: '#111827',
      lineHeight: 1.4,
      dynamicMinWidth: noteSize - 24,
    });
    
    // Add placeholder behavior
    (tb as any)._placeholder = "Write your idea...";
    (tb as any)._isPlaceholder = true;
    tb.set('text', 'Write your idea...');
    tb.set('fill', '#9ca3af'); // gray-400 for placeholder

    const group = new Group([rect, tb], { left: x, top: y });
    applyControlsTheme(group);
    (group as any).data = { type: "note", id: `note_${Date.now()}_${Math.random().toString(36).slice(2,6)}` };
    (group as any).erasable = false;
    fabricCanvas.add(group);
    fabricCanvas.setActiveObject(group);
    fabricCanvas.requestRenderAll();
    // save
    saveNotesDebounced();
  };

  // recolor active note or set default for next
  const recolorActiveNote = (c: string) => {
    setNoteColor(c);
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (obj && (obj as any).type === 'group' && (obj as any).data?.type === 'note') {
      const r = (obj as Group).getObjects().find((o: any) => o.type === 'rect') as any;
      if (r) { r.set({ fill: c }); fabricCanvas.requestRenderAll(); saveNotesDebounced(); }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addImage = () => fileInputRef.current?.click();

  const onImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fabricCanvas) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Fabric 6: use fromURL promise API
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - types may not include promise signature in this env
      FabricImage.fromURL(dataUrl).then((img: any) => {
        const { x, y } = getCanvasCenter();
        img.set({ left: x - 150, top: y - 100, selectable: true, evented: true });
        const maxW = 360;
        if (img.getScaledWidth && img.getScaledWidth() > maxW) {
          img.scaleToWidth(maxW);
        } else if (img.width && img.width > maxW) {
          img.scaleToWidth(maxW);
        }
        applyControlsTheme(img);
        (img as any).data = { type: 'image', id: `img_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, src: dataUrl };
        (img as any).erasable = false;
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.requestRenderAll();
        saveNotesDebounced();
      }).catch(() => {});
    };
    reader.readAsDataURL(file);
    // reset input
    e.currentTarget.value = "";
  };

  const zoomIn = () => {
    if (!fabricCanvas) return;
    const center = { x: fabricCanvas.getWidth() / 2, y: fabricCanvas.getHeight() / 2 } as any;
    const newZoom = Math.min(5, fabricCanvas.getZoom() * 1.2);
    fabricCanvas.zoomToPoint(center, newZoom);
    fabricCanvas.requestRenderAll();
  };

  const zoomOut = () => {
    if (!fabricCanvas) return;
    const center = { x: fabricCanvas.getWidth() / 2, y: fabricCanvas.getHeight() / 2 } as any;
    const newZoom = Math.max(0.2, fabricCanvas.getZoom() / 1.2);
    fabricCanvas.zoomToPoint(center, newZoom);
    fabricCanvas.requestRenderAll();
  };

  const clearAll = () => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (active) {
      fabricCanvas.remove(active);
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
      saveNotesDebounced();
    }
  };

  // Serialize notes
  const serializeNotes = (): any[] => {
    if (!fabricCanvas) return [];
    const out: any[] = [];
    for (const obj of fabricCanvas.getObjects()) {
      const tag = (obj as any).data;
      if (!tag || tag.type !== "note") continue;
      // Expect group with rect + textbox
      let rect: any = null, tb: any = null;
      if (obj instanceof Group) {
        (obj as Group).getObjects().forEach((child: any) => {
          if (child.type === "rect") rect = child;
          if (child.type === "textbox") tb = child;
        });
      }
      out.push({
        id: tag.id,
        left: obj.left ?? 0,
        top: obj.top ?? 0,
        width: rect?.width ?? 180,
        height: rect?.height ?? 180,
        fill: rect?.fill ?? undefined,
        stroke: rect?.stroke ?? undefined,
        text: ((tb as any)?._isPlaceholder) ? "" : (tb?.text ?? ""),
      });
    }
    return out;
  };

  // Serialize images
  const serializeImages = (): any[] => {
    if (!fabricCanvas) return [];
    const out: any[] = [];
    for (const obj of fabricCanvas.getObjects()) {
      const tag = (obj as any).data;
      if (!tag || tag.type !== 'image') continue;
      const rec: any = {
        id: tag.id,
        src: tag.src,
        left: obj.left ?? 0,
        top: obj.top ?? 0,
        scaleX: (obj as any).scaleX ?? 1,
        scaleY: (obj as any).scaleY ?? 1,
        angle: obj.angle ?? 0,
      };
      out.push(rec);
    }
    return out;
  };

  const serializeDrawings = (): any[] => {
    if (!fabricCanvas) return [];
    const out: any[] = [];
    
    for (const obj of fabricCanvas.getObjects()) {
      const tag = (obj as any).data;
      
      // Check if it's a drawing object
      if (tag && tag.type === 'drawing') {
        // Use minimal path data (Figma-style)
        const pathData = {
          id: tag.id,
          path: (obj as any).path || null,
          left: obj.left || 0,
          top: obj.top || 0,
          stroke: (obj as any).stroke || '#111111',
          strokeWidth: (obj as any).strokeWidth || 3,
          fill: (obj as any).fill || 'transparent',
        };
        out.push(pathData);
      }
    }
    
    return out;
  };

  const saveNotes = async () => {
    if (!fabricCanvas || !pinboardId || isSaving) return;
    try {
      setIsSaving(true);
      const sanitize = (o: any): any => {
        if (Array.isArray(o)) return o.map(sanitize);
        if (o && typeof o === 'object') {
          const r: any = {};
          Object.entries(o).forEach(([k, v]) => { if (v !== undefined) r[k] = sanitize(v); });
          return r;
        }
        return o;
      };
      const notes = sanitize(serializeNotes());
      const images = sanitize(serializeImages());
      const drawings = sanitize(serializeDrawings());
      
      // Generate thumbnail from canvas
      let thumbnail = '';
      try {
        const dataURL = fabricCanvas.toDataURL({
          format: 'jpeg',
          quality: 0.3,
          width: 400,
          height: 300,
          multiplier: 0.5
        });
        thumbnail = dataURL;
      } catch (err) {
        console.warn("Could not generate thumbnail:", err);
      }
      
      const pinboardRef = doc(db, "pinboards", pinboardId);
      // Save to standalone pinboard
      await setDoc(pinboardRef, {
        userId: user?.uid || 'anonymous',
        pinboard: {
          notes: notes,
          images: images,
          drawings: drawings,
          thumbnail: thumbnail,
        },
        updatedAt: new Date(), // Move updatedAt to top level
        createdAt: new Date(),
      }, { merge: true });
    } catch (err) {
      console.error("Save pinboard error", err);
    } finally {
      setIsSaving(false);
    }
  };

  let saveTimer: any = null;
  const saveNotesDebounced = () => {
    if (saveTimer) clearTimeout(saveTimer);
    // shorter debounce so drawings/images/notes persist faster
    saveTimer = setTimeout(saveNotes, 150);
  };

  // Figma-style instant stroke saving
  const saveStrokeImmediately = async (pathObj: any, strokeId: string) => {
    console.log("saveStrokeImmediately called with:", { pathObj, strokeId, pinboardId, user: user?.uid });
    
    if (!fabricCanvas || !pinboardId) {
      console.log("Missing fabricCanvas or pinboardId:", { fabricCanvas: !!fabricCanvas, pinboardId });
      return;
    }
    
    try {
      // Convert path to SVG string to avoid nested arrays
      const svgString = pathObj.toSVG ? pathObj.toSVG() : '';
      
      // Extract minimal path data (like Figma) - no nested arrays
      const pathData = {
        id: strokeId,
        svg: svgString, // Use SVG string instead of path array
        left: pathObj.left || 0,
        top: pathObj.top || 0,
        stroke: pathObj.stroke || '#111111',
        strokeWidth: pathObj.strokeWidth || 3,
        fill: pathObj.fill || 'transparent',
        timestamp: Date.now()
      };
      
      console.log("Path data to save:", pathData);
      
      const pinboardRef = doc(db, "pinboards", pinboardId);
      console.log("Pinboard reference:", pinboardRef.path);
      
      // Add stroke to existing drawings array
      const updateData = {
        [`pinboard.drawings`]: arrayUnion(pathData),
        updatedAt: new Date(),
      };
      
      console.log("Update data:", updateData);
      
      await updateDoc(pinboardRef, updateData);
      
      console.log("Stroke saved successfully to Firebase:", strokeId);
    } catch (err) {
      console.error("Error saving stroke:", err);
      console.error("Error details:", {
        error: err,
        pinboardId,
        user: user?.uid,
        pathData: pathObj
      });
    }
  };

  // Auto-save when objects move/scale
  useEffect(() => {
    if (!fabricCanvas) return;
    const handler = () => saveNotesDebounced();
    fabricCanvas.on("object:modified", handler);
    
    // Set up path:created event listener for instant stroke saving
    const onPathCreated = (evt: any) => {
      console.log("onPathCreated event triggered:", evt);
      const p = evt?.path as any;
      if (p) {
        console.log("Path object created:", p);
        const strokeId = `draw_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
        p.data = { type: 'drawing', id: strokeId };
        p.erasable = true;
        
        console.log("About to save stroke:", strokeId);
        // Save stroke immediately (Figma-style)
        saveStrokeImmediately(p, strokeId);
      } else {
        console.log("No path object in event:", evt);
      }
    };
    fabricCanvas.on('path:created', onPathCreated);
    
    // delete via Backspace/Delete
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const obj = fabricCanvas.getActiveObject();
        if (obj) {
          fabricCanvas.remove(obj);
          fabricCanvas.requestRenderAll();
          saveNotesDebounced();
        }
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => {
      fabricCanvas.off("object:modified", handler);
      fabricCanvas.off('path:created', onPathCreated);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [fabricCanvas]);


  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh)]">
      {/* Header with back button and pinboard info */}
      <div style={{
        position: 'fixed',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <button
          onClick={() => router.push('/board')}
          title="Back to board"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: 'white',
            color: '#111827',
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={18} />
        </button>
        
        {/* Pinboard ID display */}
        {pinboardId && (
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            color: '#6b7280',
            fontFamily: 'monospace',
          }}>
            Pinboard ID: {pinboardId}
          </div>
        )}
      </div>
      {/* SEO-friendly H1 (visually hidden) */}
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* Drawing is handled directly by Fabric freeDrawingBrush; no overlay needed */}

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 16,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 24,
            border: "1px solid #e5e7eb",
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          {(() => {
            const baseBtn: React.CSSProperties = {
              width: 48,
              height: 48,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#f3f4f6",
              color: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            };
            const activeBtn: React.CSSProperties = {
              ...baseBtn,
              background: "#0f172a",
              color: "#ffffff",
              border: "1px solid #0f172a",
            };
            const divider: React.CSSProperties = { width: 1, height: 28, background: "#e5e7eb", margin: "0 4px" };

            return (
              <>
                <button title="Draw" onClick={() => setActiveTool("draw")} style={activeTool === "draw" ? activeBtn : baseBtn}>
                  <Pencil size={20} />
                </button>
                <button title="Eraser" onClick={() => setActiveTool("eraser" as any)} style={activeTool === ("eraser" as any) ? activeBtn : baseBtn}>
                  <Eraser size={20} /> 
                </button>

                <div style={divider} />

                <button title="Add sticky note" onClick={addStickyNote} style={baseBtn}>
                  <StickyNote size={20} />
                </button>
                {/* Sticky note color swatches */}
                {['#FEF9C3','#E0F2FE','#FCE7F3','#DCFCE7','#F1F5F9'].map((c) => (
                  <button key={c} title="Note color" onClick={() => recolorActiveNote(c)}
                    style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: c, cursor: 'pointer' }} />
                ))}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageSelected} style={{ display: "none" }} />
                <button title="Add image" onClick={addImage} style={baseBtn}>
                  <ImagePlus size={20} />
                </button>

                <div style={divider} />

                <button title="Zoom out" onClick={zoomOut} style={baseBtn}>
                  <ZoomOut size={20} />
                </button>
                <button title="Zoom in" onClick={zoomIn} style={baseBtn}>
                  <ZoomIn size={20} />
                </button>

                <div style={divider} />
                <button title="Clear board" onClick={clearAll} style={{
                  ...baseBtn,
                  background: "#ef4444",
                  border: "1px solid #ef4444",
                  color: "white",
                }}>
                  <Trash2 size={20} />
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
