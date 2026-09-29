export interface CameraControlsHUDProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
}

export default function CameraControlsHUD({
  onZoomIn,
  onZoomOut,
  onResetCamera,
}: CameraControlsHUDProps) {
  return (
    <div className="zygoteNavControls" aria-label="Camera Navigation">
      <div className="zygoteZoomCol">
        <button
          type="button"
          className="zygoteNavBtn"
          onClick={onZoomIn}
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          className="zygoteNavBtn homeBtn"
          onClick={onResetCamera}
          title="Reset Camera View (Home)"
          aria-label="Reset Camera"
        >
          ⌂
        </button>
        <button
          type="button"
          className="zygoteNavBtn"
          onClick={onZoomOut}
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          −
        </button>
      </div>
    </div>
  );
}
