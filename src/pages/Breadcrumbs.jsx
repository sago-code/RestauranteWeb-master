import { Link } from 'react-router-dom';

function Breadcrumbs({ items }) {
  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="breadcrumb bg-dark p-2 rounded">
        {items.map((item, idx) => (
          <li
            key={idx}
            className={`breadcrumb-item${idx === items.length - 1 ? ' active text-white' : ''}`}
            aria-current={idx === items.length - 1 ? 'page' : undefined}
          >
            {item.to ? <Link to={item.to} className="text-decoration-none text-light">{item.label}</Link> : item.label}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;