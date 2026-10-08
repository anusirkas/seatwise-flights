/** A plane seen from above, nose up. Rotate it to point it anywhere. */
export default function Plane({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 1.5c.8 0 1.4 1.1 1.4 2.6v4.6l7.8 4.5c.3.2.5.5.5.9v1.2l-8.3-2.5v4.6l2.3 1.7v1.4L12 19.6l-3.7.9v-1.4l2.3-1.7v-4.6l-8.3 2.5v-1.2c0-.4.2-.7.5-.9l7.8-4.5V4.1c0-1.5.6-2.6 1.4-2.6Z"
      />
    </svg>
  );
}
