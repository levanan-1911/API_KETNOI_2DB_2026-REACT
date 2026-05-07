import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EmployeeEdit() {
  const nav = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({ FullName: "", DepartmentID: "", PositionID: "", Status: "Active" });
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/departments").then(r => r.json()).then(setDepartments);
    fetch("http://localhost:5000/api/positions").then(r => r.json()).then(setPositions);
    fetch(`http://localhost:5000/api/employees/${id}`).then(r => r.json()).then(data => setForm(data));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`http://localhost:5000/api/employees/${id}`, {
      method: "PUT",
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
      <h3>Edit Employee</h3>
      <form onSubmit={handleSubmit} className="card p-4 mt-3">
        <label>Full Name</label>
        <input id="FullName" className="form-control mb-2" value={form.FullName || ""} onChange={handleChange} required />
        <button className="btn btn-primary mt-2">Save Changes</button>
      </form>
    </div>
  );
}