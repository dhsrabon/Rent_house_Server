"use client";

import { useEffect, useState } from "react";

export default function AllUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users));
  }, []);

  const handleRoleChange = async (id, newRole) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/update-role/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        alert("Role updated!");
        // ইউজার লিস্ট রিফ্রেশ করা
        window.location.reload(); 
      }
    } catch (error) {
      alert("Failed to update role");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manage Users</h1>
      <table className="table w-full bg-white rounded-xl shadow-sm">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Current Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td><span className="badge badge-primary">{user.role}</span></td>
              <td>
                <select 
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  className="select select-sm select-bordered"
                  defaultValue={user.role}
                >
                  <option value="tenant">Tenant</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, adminSecret, photo } = req.body;

    // 🔴 ডাইনামিক অ্যাডমিন লজিক
    let assignedRole = role || 'tenant'; // ডিফল্ট রোল
    
    if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
      assignedRole = 'admin'; // সিক্রেট কি মিলে গেলে রোল হবে 'admin'
    }

    const newUser = new User({
      name,
      email,
      password, // (অবশ্যই bcrypt দিয়ে হ্যাশ করে নিবেন)
      role: assignedRole,
      photo
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "User registered successfully!", user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};