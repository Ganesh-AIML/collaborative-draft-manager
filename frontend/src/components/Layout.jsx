import './Layout.css';

function Layout({ children }) {
  return (
    <div className="app-layout">
      <div className="app-layout__inner">{children}</div>
    </div>
  );
}

export default Layout;
