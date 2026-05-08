/**
 * Mock react-router-dom cho Jest (CRA không hỗ trợ ESM của v7)
 */
const React = require("react");

const MemoryRouter = ({ children }) => React.createElement(React.Fragment, null, children);
const BrowserRouter = ({ children }) => React.createElement(React.Fragment, null, children);
const Routes = ({ children }) => React.createElement(React.Fragment, null, children);
const Route = () => null;
const Link = ({ children, to, ...props }) =>
  React.createElement("a", { href: to, ...props }, children);
const Navigate = () => null;

const useNavigate = () => jest.fn();
const useLocation = () => ({ pathname: "/", search: "", hash: "", state: null });
const useParams   = () => ({});

module.exports = {
  MemoryRouter,
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
};
