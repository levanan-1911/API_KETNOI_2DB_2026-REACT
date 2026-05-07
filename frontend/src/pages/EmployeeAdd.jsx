import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EmployeeAdd() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    FullName: "", DateOfBirth: "", Gender: "", PhoneNumber: "",
    Email: "", HireDate: "", DepartmentID: "", PositionID: "", Status: "Active"
  });
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/departments").then(r => r.json()).then(setDepartments);
    fetch("http://localhost:5000/api/positions").then(r => r.json()).then(setPositions);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:5000/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    .then(r => r.json())
    .then(res => {
      alert(res.msg);
      if (res.status === "success") nav("/");
    });
  };

  return ( 
    <div>
      <h3>Add New Employee</h3>
      <form onSubmit={handleSubmit} className="card p-4 mt-3">
        <label>Full Name</label>
        <input id="FullName" className="form-control mb-2" onChange={handleChange} required />
        
        <label>Department</label>
        <select id="DepartmentID" className="form-control mb-2" onChange={handleChange} required>
          <option value="">-- Select Department --</option>
          {departments.map(d => <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName}</option>)}
        </select>

        <label>Position</label>
        <select id="PositionID" className="form-control mb-2" onChange={handleChange} required>
          <option value="">-- Select Position --</option>
          {positions.map(p => <option key={p.PositionID} value={p.PositionID}>{p.PositionName}</option>)}
        </select>

        <button className="btn btn-primary mt-2">Add Employee</button>
      </form>
    </div>
  );
}