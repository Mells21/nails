import { useEffect, useState } from 'react';
import { getAllClients, getClientNote, upsertClientNote } from '../../api/profiles';
import { getClientAppointments } from '../../api/appointments';
import { openWhatsApp } from '../../utils/whatsapp';
import { formatPrice, toReadableDate } from '../../utils/dates';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Search, MessageCircle, ChevronRight, Save, Heart, AlertTriangle, Phone, Mail } from 'lucide-react';
import { toast } from '../../utils/toast';
import { ClientCardSkeleton } from '../../components/ui/CardSkeletons';
import Skeleton from '../../components/ui/Skeleton';

const ClientsCRM = () => {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllClients().then((data) => {
      setClients(data);
      setFiltered(data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) { setFiltered(clients); return; }
    setFiltered(clients.filter((c) =>
      c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.phone?.includes(debouncedSearch)
    ));
  }, [debouncedSearch, clients]);

  const openClient = async (client) => {
    setSelectedClient(client);
    setNotes('');
    setClientHistory([]);
    const [note, history] = await Promise.all([
      getClientNote(client.id).catch(() => ''),
      getClientAppointments(client.id).catch(() => []),
    ]);
    setNotes(note);
    setClientHistory(history);
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await upsertClientNote(selectedClient.id, notes);
      toast.success('Notas guardadas');
    } catch (err) {
      toast.error(err.message || 'Error al guardar.');
    } finally { setSaving(false); }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Clientas</h1>
        {loading ? <Skeleton className="skeleton-text" style={{ width: 90 }} /> : <p>{clients.length} registradas</p>}
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="clients-list">
        {loading && Array.from({ length: 5 }).map((_, i) => <ClientCardSkeleton key={i} />)}
        {!loading && filtered.map((client) => (
          <div key={client.id} className="client-card">
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
        {!loading && filtered.length === 0 && <div className="empty-state-sm"><p>No se encontraron clientas.</p></div>}
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
              <p><Phone size={14} /> {selectedClient.phone}</p>
              <p><Mail size={14} /> {selectedClient.email}</p>
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
