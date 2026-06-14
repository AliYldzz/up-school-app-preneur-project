import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';

export default function AdminPanel({ onLogout }) {
  const [stats, setStats] = useState({ total_users: 0, total_tasks: 0, completed_tasks: 0 });
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = () => {
    const token = localStorage.getItem('token');
    
    Promise.all([
      fetch(`${API_BASE_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
    ])
    .then(([statsData, usersData]) => {
      setStats(statsData);
      setUsers(usersData);
      setIsLoading(false);
    })
    .catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`${userName} adlı kullanıcıyı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      const token = localStorage.getItem('token');
      fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) {
          fetchAdminData(); // Refresh list
        } else {
          alert("Silme işlemi başarısız oldu.");
        }
      })
      .catch(err => {
        alert("Bir hata oluştu.");
      });
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <h2 style={{color: '#1B2A1C'}}>Admin Paneli Yükleniyor...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Kumanda Merkezi 🎛️</h1>
          <p style={styles.subtitle}>Sistemin genel durumunu ve kullanıcıları buradan yönetin.</p>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn}>Sistemden Çık</button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div>
            <div style={styles.statValue}>{stats.total_users}</div>
            <div style={styles.statLabel}>Toplam Öğrenci</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📝</div>
          <div>
            <div style={styles.statValue}>{stats.total_tasks}</div>
            <div style={styles.statLabel}>Oluşturulan Plan</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div>
            <div style={styles.statValue}>{stats.completed_tasks}</div>
            <div style={styles.statLabel}>Tamamlanan Görev</div>
          </div>
        </div>
      </div>

      <div style={styles.panel}>
        <h2 style={styles.panelTitle}>Öğrenci Listesi</h2>
        
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Ad Soyad</th>
                <th style={styles.th}>E-posta</th>
                <th style={styles.th}>Alan</th>
                <th style={styles.th}>Hedef</th>
                <th style={styles.th}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>#{u.id}</td>
                  <td style={styles.td}><strong>{u.fullName}</strong></td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{u.focus_area}</span>
                  </td>
                  <td style={styles.td}>{u.target_goal}</td>
                  <td style={styles.td}>
                    <button 
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteUser(u.id, u.fullName)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" style={{padding: '24px', textAlign: 'center', color: '#6C7E6E'}}>Henüz sisteme kayıtlı öğrenci yok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    background: '#CBE0D1',
    padding: '24px',
    borderRadius: '24px',
    border: '1px solid #B2C7B8',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '800',
    color: '#1B2A1C',
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#4A5D4C',
    fontSize: '15px',
  },
  logoutBtn: {
    backgroundColor: 'rgba(192, 57, 43, 0.05)',
    color: '#C0392B',
    border: '1px solid rgba(192, 57, 43, 0.3)',
    padding: '10px 20px',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  statCard: {
    background: '#FFF',
    padding: '24px',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #D5DDD6',
  },
  statIcon: {
    fontSize: '36px',
    marginRight: '20px',
    background: '#F3F6F4',
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '20px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#1B2A1C',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6C7E6E',
    fontWeight: '600',
  },
  panel: {
    background: '#FFF',
    borderRadius: '24px',
    padding: '32px',
    border: '1px solid #D5DDD6',
  },
  panelTitle: {
    margin: '0 0 24px 0',
    fontSize: '20px',
    fontWeight: '800',
    color: '#1B2A1C',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  trHead: {
    borderBottom: '2px solid #EBF0EC',
  },
  th: {
    textAlign: 'left',
    padding: '16px',
    color: '#6C7E6E',
    fontWeight: '700',
    fontSize: '14px',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #EBF0EC',
  },
  td: {
    padding: '16px',
    color: '#1B2A1C',
    fontSize: '15px',
  },
  badge: {
    background: '#EBF5FB',
    color: '#3498DB',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
  },
  deleteBtn: {
    background: '#FEF2F2',
    color: '#EF4444',
    border: '1px solid #FEE2E2',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  }
};
