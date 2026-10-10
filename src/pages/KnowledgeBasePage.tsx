import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState, Modal } from '@/components/ui';
import type { KnowledgeSource } from '@/types/database';
import {
  BookOpen, Upload, Link as LinkIcon, FileText, Trash2,
  RefreshCw, Plus, Loader2, Globe, File
} from 'lucide-react';

export function KnowledgeBasePage() {
  const { user } = useAuth();
  const { currentBusiness } = useBusiness();
  const { showToast } = useToast();
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addMode, setAddMode] = useState<'file' | 'url' | 'text'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textName, setTextName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSources = async () => {
    if (!currentBusiness) return;
    const { data } = await supabase
      .from('knowledge_sources')
      .select('*')
      .eq('business_id', currentBusiness.id)
      .order('created_at', { ascending: false });
    setSources((data ?? []) as KnowledgeSource[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchSources();
  }, [currentBusiness]);

  const chunkText = (text: string, chunkSize = 500): string[] => {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const handleFileUpload = async (file: File) => {
    if (!currentBusiness || !user) return;
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${currentBusiness.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('knowledge-files')
      .upload(fileName, file);

    if (uploadError) {
      showToast('Upload failed: ' + uploadError.message, 'error');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('knowledge-files')
      .getPublicUrl(fileName);

    let extractedText = '';
    if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'application/json') {
      extractedText = await file.text();
    } else {
      extractedText = `[Uploaded document: ${file.name}. Content will be processed by the AI engine.]`;
    }

    const { data: source, error: sourceError } = await supabase
      .from('knowledge_sources')
      .insert({
        business_id: currentBusiness.id,
        name: file.name,
        source_type: 'file',
        file_url: urlData.publicUrl,
        raw_text: extractedText,
        status: 'processed',
        chunk_count: 0,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (sourceError) {
      showToast(sourceError.message, 'error');
      setUploading(false);
      return;
    }

    if (extractedText && extractedText.length > 0) {
      const chunks = chunkText(extractedText);
      const chunkInserts = chunks.map((content, index) => ({
        knowledge_source_id: source.id,
        business_id: currentBusiness.id,
        content,
        chunk_index: index,
      }));
      await supabase.from('knowledge_chunks').insert(chunkInserts);
      await supabase.from('knowledge_sources').update({ chunk_count: chunks.length }).eq('id', source.id);
    }

    setUploading(false);
    setShowAddModal(false);
    showToast(`Uploaded ${file.name} successfully!`, 'success');
    fetchSources();
  };

  const handleAddUrl = async () => {
    if (!currentBusiness || !urlInput.trim()) return;
    setUploading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url: urlInput, businessId: currentBusiness.id }),
      });
      if (!response.ok) throw new Error(`Failed to extract URL (${response.status})`);
      const data = await response.json();
      const extractedText = data.text || '';
      const { data: source, error } = await supabase
        .from('knowledge_sources')
        .insert({
          business_id: currentBusiness.id,
          name: urlInput,
          source_type: 'url',
          url: urlInput,
          raw_text: extractedText,
          status: 'processed',
          chunk_count: 0,
        })
        .select()
        .single();
      if (error) throw error;
      if (extractedText) {
        const chunks = chunkText(extractedText);
        const chunkInserts = chunks.map((content, index) => ({
          knowledge_source_id: source.id,
          business_id: currentBusiness.id,
          content,
          chunk_index: index,
        }));
        await supabase.from('knowledge_chunks').insert(chunkInserts);
        await supabase.from('knowledge_sources').update({ chunk_count: chunks.length }).eq('id', source.id);
      }
      showToast('Website content added!', 'success');
      setUrlInput('');
      setShowAddModal(false);
      fetchSources();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add URL', 'error');
    }
    setUploading(false);
  };

  const handleAddText = async () => {
    if (!currentBusiness || !textInput.trim() || !textName.trim()) return;
    setUploading(true);
    const { data: source, error } = await supabase
      .from('knowledge_sources')
      .insert({
        business_id: currentBusiness.id,
        name: textName,
        source_type: 'text',
        raw_text: textInput,
        status: 'processed',
        chunk_count: 0,
      })
      .select()
      .single();
    if (error) {
      showToast(error.message, 'error');
      setUploading(false);
      return;
    }
    const chunks = chunkText(textInput);
    const chunkInserts = chunks.map((content, index) => ({
      knowledge_source_id: source.id,
      business_id: currentBusiness.id,
      content,
      chunk_index: index,
    }));
    await supabase.from('knowledge_chunks').insert(chunkInserts);
    await supabase.from('knowledge_sources').update({ chunk_count: chunks.length }).eq('id', source.id);

    setUploading(false);
    setShowAddModal(false);
    setTextInput('');
    setTextName('');
    showToast('Text knowledge added!', 'success');
    fetchSources();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('knowledge_sources').delete().eq('id', id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast('Knowledge source deleted', 'success');
    fetchSources();
  };

  const handleReprocess = async (source: KnowledgeSource) => {
    if (!currentBusiness || !source.raw_text) return;
    await supabase.from('knowledge_chunks').delete().eq('knowledge_source_id', source.id);
    const chunks = chunkText(source.raw_text);
    const chunkInserts = chunks.map((content, index) => ({
      knowledge_source_id: source.id,
      business_id: currentBusiness.id,
      content,
      chunk_index: index,
    }));
    await supabase.from('knowledge_chunks').insert(chunkInserts);
    await supabase.from('knowledge_sources').update({ chunk_count: chunks.length }).eq('id', source.id);
    showToast('Reprocessed successfully', 'success');
    fetchSources();
  };

  if (!currentBusiness) {
    return <EmptyState icon={BookOpen} title="No business" description="Create a business first." />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Knowledge Base"
        subtitle={`${sources.length} sources`}
        icon={BookOpen}
        action={<button onClick={() => setShowAddModal(true)} className="btn-primary"><Plus size={16} /> Add Knowledge</button>}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-teal-400" /></div>
      ) : sources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No knowledge yet"
          description="Upload documents or add website URLs to teach your AI agent about your business."
          action={<button onClick={() => setShowAddModal(true)} className="btn-primary"><Plus size={16} /> Add Knowledge</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((source) => (
            <div key={source.id} className="glass-card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                    {source.source_type === 'url' ? <Globe size={18} className="text-blue-400" /> :
                     source.source_type === 'text' ? <FileText size={18} className="text-teal-400" /> :
                     <File size={18} className="text-amber-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{source.name}</p>
                    <p className="text-xs text-slate-500">{source.source_type} • {new Date(source.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="badge-green">{source.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{source.chunk_count} chunks extracted</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleReprocess(source)} className="text-slate-500 hover:text-teal-400 flex items-center gap-1">
                    <RefreshCw size={14} /> Reprocess
                  </button>
                  <button onClick={() => handleDelete(source.id)} className="text-slate-500 hover:text-red-400 flex items-center gap-1">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Knowledge Source">
        <div className="flex gap-2 mb-4">
          {(['file', 'url', 'text'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setAddMode(mode)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${addMode === mode ? 'bg-teal-500/15 text-teal-300 border border-teal-500/20' : 'bg-white/[0.03] text-slate-400 border border-white/[0.08]'}`}
            >
              {mode === 'file' ? 'Upload File' : mode === 'url' ? 'Website URL' : 'Manual Text'}
            </button>
          ))}
        </div>

        {addMode === 'file' && (
          <div>
            <label className="flex flex-col items-center justify-center gap-2 px-4 py-10 rounded-xl bg-white/[0.03] border border-dashed border-white/[0.15] cursor-pointer hover:bg-white/[0.05] hover:border-teal-500/30 transition-all">
              {uploading ? (
                <><Loader2 size={24} className="animate-spin text-teal-400" /><span className="text-sm text-slate-400">Uploading...</span></>
              ) : (
                <><Upload size={24} className="text-slate-500" /><span className="text-sm text-slate-400">Click to upload</span><span className="text-xs text-slate-500">PDF, DOCX, TXT, MD up to 10MB</span></>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.json"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
              />
            </label>
          </div>
        )}

        {addMode === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="label-text">Website URL</label>
              <div className="relative">
                <LinkIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input-field pl-11" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/about" />
              </div>
            </div>
            <button onClick={handleAddUrl} disabled={!urlInput.trim() || uploading} className="btn-primary w-full">
              {uploading ? 'Extracting...' : 'Add Website'}
            </button>
          </div>
        )}

        {addMode === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="label-text">Name</label>
              <input className="input-field" value={textName} onChange={(e) => setTextName(e.target.value)} placeholder="e.g. Pricing Details" />
            </div>
            <div>
              <label className="label-text">Content</label>
              <textarea className="input-field min-h-[120px]" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Enter your business knowledge text..." />
            </div>
            <button onClick={handleAddText} disabled={!textInput.trim() || !textName.trim() || uploading} className="btn-primary w-full">
              {uploading ? 'Adding...' : 'Add Text'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
