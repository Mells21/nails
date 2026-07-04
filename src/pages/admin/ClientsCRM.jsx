import { useEffect, useState } from 'react';
import { openWhatsApp } from '../../utils/whatsapp';
import { formatPrice, toReadableDate } from '../../utils/dates';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Search, MessageCircle, ChevronRight, Save, Heart, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// TODO: fetch/update clients and appointment history via Supabase
const ClientsCRM = () => {
  const [clients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!search) { setFiltered(clients); return; }
    setFiltered(clients.filter((c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    ));
  }, [search, clients]);

  const openClient = (client) => {
    setSelectedClient(client);
    setNotes(client.notes || '');
    setClientHistory([]);
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      toast.error('Guardado no disponible: falta conectar el backend.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Clientas</h1>
        <p>{clients.length} registradas</p>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="clients-list">
        {filtered.map((client) => (
          <div key={client.uid} className="client-card">
            <div className="client-avatar">
              {client.name?.[0]?.toUpperCase()}
            </div>
            <div className="client-info">
              <strong>{client.name}</strong>
              <span>{client.phone}</span>
              <span>{client.email}</span>
            </div>
            <div className="client-actions">
              <button
                className="btn btn-whatsapp btn-sm"
                onClick={() => openWhatsApp(client.phone, `¡Hola ${client.name}! 💅`)}
              >
                <MessageCircle size={14} />
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => openClient(client)}
              >
                <ChevronRight size={14} /> Ver ficha
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state-sm"><p>No se encontraron clientas.</p></div>}
      </div>

      {/* Client detail modal */}
      <Modal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={selectedClient?.name}
        size="lg"
      >
        {selectedClient && (
          <div className="client-detail">
            <div className="client-meta">
              <p>📱 {selectedClient.phone}</p>
              <p>✉️ {selectedClient.email}</p>
              {selectedClient.favoriteColors && <p><Heart size={14} /> {selectedClient.favoriteColors}</p>}
              {selectedClient.allergies && <p><AlertTriangle size={14} /> Alergias: {selectedClient.allergies}</p>}
            </div>

            <div className="form-group">
              <label>Notas de la dueña</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferencias, detalles importantes..."
              />
              <button className="btn btn-primary btn-sm" onClick={saveNotes} disabled={saving}>
                {saving ? <span className="spinner-sm" /> : <Save size={14} />} Guardar notas
              </button>
            </div>

            <div className="client-history">
              <h4>Historial de citas</h4>
              {clientHistory.length === 0 ? (
                <p className="text-muted">Sin citas previas.</p>
              ) : (
                clientHistory.map((apt) => (
                  <div key={apt.id} className="history-item">
                    <Badge status={apt.status} />
                    <span>{toReadableDate(apt.date)}</span>
                    <span>{apt.serviceName}</span>
                    <span>{formatPrice(apt.servicePrice)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientsCRM;
