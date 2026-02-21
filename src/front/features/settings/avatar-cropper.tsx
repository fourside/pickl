import { useCallback, useState } from "react";
import type { Area } from "react-easy-crop";
import Cropper from "react-easy-crop";
import styles from "./settings.module.css";

interface AvatarCropperProps {
  imageSrc: string;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

const OUTPUT_SIZE = 192;

export function AvatarCropper({
  imageSrc,
  onCrop,
  onCancel,
}: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleSave = useCallback(async () => {
    if (!croppedArea) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
    });

    ctx.drawImage(
      image,
      croppedArea.x,
      croppedArea.y,
      croppedArea.width,
      croppedArea.height,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      "image/webp",
      0.85,
    );
  }, [croppedArea, imageSrc, onCrop]);

  return (
    <div className={styles.cropperOverlay}>
      <div className={styles.cropperModal}>
        <div className={styles.cropperContainer}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className={styles.cropperActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
