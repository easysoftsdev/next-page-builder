export function RenderText({ props }: { props: Record<string, unknown> }) {
  const text = typeof props.text === "string" ? props.text : "";
  const fontSize = typeof props.fontSize === "number" ? props.fontSize : undefined;
  const lineHeight = typeof props.lineHeight === "number" ? props.lineHeight : undefined;
  const fontWeight =
    typeof props.fontWeight === "number" || typeof props.fontWeight === "string"
      ? props.fontWeight
      : undefined;
  const color = typeof props.color === "string" ? props.color : undefined;

  return (
    <p
      className="renderer-text"
      style={{
        fontSize: fontSize === undefined ? undefined : `${fontSize}px`,
        lineHeight,
        fontWeight,
        color,
      }}
    >
      {text}
    </p>
  );
}
