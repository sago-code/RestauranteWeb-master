import { Link } from 'react-router-dom';

function Breadcrumbs({ items }) {
  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="breadcrumb bg-dark p-2 rounded" style={{ '--bs-breadcrumb-divider': '""' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            className={`breadcrumb-item${idx === items.length - 1 ? ' active text-white' : ''}`}
            aria-current={idx === items.length - 1 ? 'page' : undefined}
            style={{before: 'padding-right: 0 !important'}}
          >
            {item.to ? <Link to={item.to} className="text-decoration-none text-light">{item.label}</Link> : item.label}
            <label className="text-white ms-2">{idx < items.length - 1 ? '>' : ''}</label>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;