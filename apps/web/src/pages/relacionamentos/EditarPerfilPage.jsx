import UfCidadeFields from '@/components/UfCidadeFields.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, X, ArrowLeft } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import RelacionamentosGuard from '@/components/relacionamentos/RelacionamentosGuard';

const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const PREFS = [
  { value: 'amizade', label: 'Amizade' },
  { value: 'namoro', label: 'Namoro' },
  { value: 'casamento', label: 'Casamento' },
  { value: 'networking', label: 'Networking' },
  { value: 'estudo', label: 'Estudo bíblico' },
];

function EditarPerfilContent() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfilId, setPerfilId] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [form, setForm] = useState({
    apelido: '', data_nascimento: '', status_relacionamento: '',
    preferencias: [], bio: '', cidade: '', estado: '', visibilidade: 'membros', ativo: true,
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    const uid = pb.authStore.record?.id;
    pb.collection('rel_perfis').getList(1, 1, {
      filter: pb.filter('owner = {:id}', { id: uid }),
      requestKey: 'editar-perfil-load',
    }).then((res) => {
      if (res.items[0]) {
        const p = res.items[0];
        setPerfilId(p.id);
        setForm({
          apelido: p.apelido || '',
          data_nascimento: p.data_nascimento ? p.data_nascimento.substring(0, 10) : '',
          status_relacionamento: p.status_relacionamento || '',
          preferencias: Array.isArray(p.preferencias) ? p.preferencias : (p.preferencias ? [p.preferencias] : []),
          bio: p.bio || '',
          cidade: p.cidade || '',
          estado: p.estado || '',
          visibilidade: p.visibilidade || 'membros',
          ativo: p.ativo !== false,
        });
        if (p.foto) setFotoPreview(pb.files.getURL(p, p.foto, { thumb: '200x200' }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const togglePref = (val) => {
    setForm((prev) => ({
      ...prev,
      preferencias: prev.preferencias.includes(val)
        ? prev.preferencias.filter((v) => v !== val)
        : [...prev.preferencias, val],
    }));
  };

  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return null;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErro(''); setSucesso('');
    const idade = calcularIdade(form.data_nascimento);
    if (form.data_nascimento && idade !== null && idade < 18) {
      setErro('Você precisa ter 18 anos ou mais para usar esta área.');
      return;
    }
    setSaving(true);
    try {
      const uid = pb.authStore.record.id;
      const fd = new FormData();
      fd.append('owner', uid);
      fd.append('apelido', form.apelido);
      if (form.data_nascimento) fd.append('data_nascimento', form.data_nascimento + ' 00:00:00.000Z');
      fd.append('status_relacionamento', form.status_relacionamento);
      form.preferencias.forEach((p) => fd.append('preferencias', p));
      fd.append('bio', form.bio);
      fd.append('cidade', form.cidade);
      fd.append('estado', form.estado);
      fd.append('visibilidade', form.visibilidade);
      fd.append('ativo', form.ativo ? 'true' : 'false');
      if (fotoFile) fd.append('foto', fotoFile);

      if (perfilId) {
        await pb.collection('rel_perfis').update(perfilId, fd);
      } else {
        const rec = await pb.collection('rel_perfis').create(fd);
        setPerfilId(rec.id);
      }
      setSucesso('Perfil salvo com sucesso!');
      setTimeout(() => navigate('/relacionamentos/dashboard'), 1200);
    } catch (err) {
      setErro('Não foi possível salvar o perfil. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <>
      <Helmet>
        <title>Editar Perfil | Relacionamentos | Conexão Batista</title>
        <meta name="description" content="Configure seu perfil na área de Relacionamentos do Conexão Batista." />
      </Helmet>
      <div className="mx-auto max-w-xl px-5 py-12 lg:px-0">
        <button onClick={() => navigate('/relacionamentos/dashboard')} className="mb-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar ao painel
        </button>
        <h1 className="font-display text-3xl font-extrabold text-primary mb-8">{perfilId ? 'Editar Perfil' : 'Criar Perfil'}</h1>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto do perfil" className="h-28 w-28 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted border-2 border-dashed border-border">
                  <Camera size={28} className="text-muted-foreground" />
                </div>
              )}
              <button type="button" onClick={() => fileRef.current.click()}
                className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-primary text-white shadow">
                <Camera size={14} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFoto} className="hidden" />
            <p className="text-xs text-muted-foreground">Foto opcional. Máx. 5 MB.</p>
          </div>

          {/* Fields */}
          <div className="rounded-2xl border border-border bg-white p-6 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Nome ou apelido</label>
              <input value={form.apelido} onChange={(e) => setForm({ ...form, apelido: e.target.value })}
                placeholder="Como você quer ser chamado(a)?"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Data de nascimento <span className="text-destructive">*</span></label>
              <input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} required
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              <p className="mt-1 text-xs text-muted-foreground">Necessário para validar a maioridade (18+). Não será exibida publicamente.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Status de relacionamento</label>
              <select value={form.status_relacionamento} onChange={(e) => setForm({ ...form, status_relacionamento: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="">Não informar</option>
                <option value="solteiro">Solteiro(a)</option>
                <option value="viuvo">Viúvo(a)</option>
                <option value="divorciado">Divorciado(a)</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Busco (pode selecionar mais de uma)</label>
              <div className="flex flex-wrap gap-2">
                {PREFS.map((p) => (
                  <button key={p.value} type="button" onClick={() => togglePref(p.value)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${form.preferencias.includes(p.value) ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:border-primary/50'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Sobre mim</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} maxLength={600}
                placeholder="Fale um pouco sobre você, sua fé, seus interesses…"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
              <p className="mt-1 text-xs text-muted-foreground text-right">{form.bio.length}/600</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Cidade</label>
                <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="Sua cidade"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  <option value="">UF</option>
                  {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Visibilidade do perfil</label>
              <select value={form.visibilidade} onChange={(e) => setForm({ ...form, visibilidade: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="publico">Público (todos os membros autenticados)</option>
                <option value="membros">Apenas membros validados</option>
                <option value="privado">Privado (somente eu)</option>
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                className="h-5 w-5 accent-primary" />
              <span className="text-sm font-semibold">Perfil ativo (visível nas buscas)</span>
            </label>
          </div>

          {erro && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}
          {sucesso && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{sucesso}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/relacionamentos/dashboard')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3.5 font-display text-sm font-bold text-foreground hover:bg-muted">
              <X size={16} /> Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-sm font-bold text-primary-foreground disabled:opacity-60">
              <Save size={16} /> {saving ? 'Salvando…' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function RelacionamentosEditarPerfilPage() {
  return (
    <RelacionamentosGuard>
      <EditarPerfilContent />
    </RelacionamentosGuard>
  );
}
