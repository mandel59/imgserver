export default function Controls() {
  return (
    <div id="controls">
      <select id="sort-option" onChange={() => {}}>
        <option value="name">名前順</option>
        <option value="date">更新日時順</option>
      </select>
    </div>
  );
}
