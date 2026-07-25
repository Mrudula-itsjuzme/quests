export function NyxCat({ small = false }) {
  return (
    <div className={`css-cat ${small ? 'small' : ''}`} aria-hidden="true">
      <span className="cat-tail" />
      <span className="cat-body" />
      <span className="cat-head">
        <span className="cat-ear left" />
        <span className="cat-ear right" />
        <span className="cat-eye left" />
        <span className="cat-eye right" />
        <span className="cat-nose" />
      </span>
      <span className="cat-scarf" />
    </div>
  );
}
