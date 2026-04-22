import React, { useEffect, useState } from 'react'

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const fetchTasks = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/tasks/");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("API Bağlantı Hatası:", error);
    }
  };

  useEffect(() => {
    fetchTasks(); // Sayfa yüklendiğinde GET isteği at
  }, []);

  const handleAddTask = async () => {
    if (!newTaskTitle) return;
    
    try {
      const response = await fetch("http://localhost:8000/api/tasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle })
      });
      if (response.ok) {
        setNewTaskTitle("");
        fetchTasks(); // Listeyi güncelle
      }
    } catch (error) {
      console.error("Görev ekleme hatası:", error);
    }
  };

  const handleRemoveTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTasks(); // Silindikten sonra listeyi yenile
      }
    } catch (error) {
      console.error("Görev silme hatası:", error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Sınav Sistemine Hoşgeldin</h1>
      <p>Aşağıdaki liste FastAPI Backend'inden <b>GET</b> isteğiyle çekilmiştir:</p>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={newTaskTitle} 
          onChange={(e) => setNewTaskTitle(e.target.value)} 
          placeholder="Yeni görev adı..."
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button onClick={handleAddTask} style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Görev Ekle (POST)
        </button>
      </div>

      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {tasks.map(task => (
           <li key={task.id} style={{ padding: '10px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span>{task.title} - <b>Durum:</b> {task.status}</span>
             <button 
                onClick={() => handleRemoveTask(task.id)}
                style={{ background: '#f44336', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Sil (DELETE)
             </button>
           </li>
        ))}
      </ul>
      {tasks.length === 0 && <p>Henüz kayıtlı görev yok.</p>}
    </div>
  )
}

export default App
