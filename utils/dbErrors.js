// server/utils/dbErrors.js
export function isFkConstraintError(err) {
  const errno = err?.parent?.errno ?? err?.original?.errno;
  const code = err?.parent?.code ?? err?.original?.code;
  return (
    err?.name === "SequelizeForeignKeyConstraintError" ||
    errno === 1451 || // Cannot delete or update a parent row
    code === "ER_ROW_IS_REFERENCED_2"
  );
}

export function extractReferencedTable(err) {
  const msg = err?.parent?.sqlMessage || err?.original?.sqlMessage || "";
  // Ej: fails (`tunik`.`vehiculos`, CONSTRAINT ...)
  const m = msg.match(/fails\s+\(`[^`]+`\.`([^`]+)`/i);
  return m?.[1] || null;
}

export function fkDeleteMessage(entityLabel, err) {
  const refTable = extractReferencedTable(err);
  const tail = refTable ? ` (referenciado en: ${refTable})` : "";
  return `No se puede eliminar ${entityLabel} porque está asociado a otros registros${tail}.`;
}
