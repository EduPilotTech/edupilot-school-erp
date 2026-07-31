// Pure — deliberately no "server-only" import and no Prisma dependency, unlike every other file in
// this module's application layer, so it is trivially unit-testable in isolation (see the
// co-located .test.ts). The DB-backed counterpart (fetching a NotificationTemplate row) lives in
// notification-template.service.ts / notification-queue.service.ts; this function only ever
// operates on plain strings supplied by its caller.
//
// Design decision: a `{{variableName}}` placeholder present in the template but ABSENT from the
// supplied `variables` map is left as the literal text `{{variableName}}`, not thrown. A template
// can legitimately be edited (a new placeholder added) independently of every caller being updated
// to supply it in the same deploy; throwing here would turn an unrelated template edit into a hard
// failure for every notification send in flight that still uses the old caller shape. The literal
// placeholder text left in the rendered output is a visible, debuggable signal of the mismatch —
// far safer than crashing an entire dispatch pipeline over what is usually a display-only
// Notice/Alert body.
export function renderNotificationTemplate(
  template: { subject: string | null; message: string },
  variables: Record<string, string>
): { subject: string | null; message: string } {
  const substitute = (text: string): string =>
    text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, name: string) =>
      Object.prototype.hasOwnProperty.call(variables, name) ? variables[name] : match
    );

  return {
    subject: template.subject !== null ? substitute(template.subject) : null,
    message: substitute(template.message),
  };
}
