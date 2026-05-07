import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Employees() {
  const [employees, setEmployees] = useState([]);

  const loadEmployees = () => {
    fetch("http://localhost:5000/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error("Lỗi tải danh sách:", err));
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const deleteEmployee = (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa nhân viên này?")) return;
    fetch(`http://localhost:5000/api/employees/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((rs) => {
        alert(rs.msg);
        if (rs.status === "success") loadEmployees();
      });
  };

  return (
    <div>
      <h3>Employee List</h3>
      <Link to="/employees/add" className="btn btn-success mb-3">+ Add Employee</Link>
      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>ID</th><th>Full Name</th><th>Department</th><th>Position</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.EmployeeID}>
              <td>{emp.EmployeeID}</td>
              <td>{emp.FullName}</td>
              <td>{emp.Department}</td>
              <td>{emp.Position}</td>
              <td>
                <Link className="btn btn-primary btn-sm me-2" to={`/employees/${emp.EmployeeID}`}>Edit</Link>
                <button className="btn btn-danger btn-sm" onClick={() => deleteEmployee(emp.EmployeeID)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
