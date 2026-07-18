/**
 * WizardBuilder.tsx
 * -------------------
 * İşletme sahibinin KENDİ wizard'ını (adımlarını + sorularını) tasarladığı ekran.
 * Tek bileşen, iki senaryoyu da kapsar:
 *   kind="setup_extra"  -> İşletme profilim sihirbazına eklenen ek adımlar
 *   kind="booking"      -> Müşteriye rezervasyon sırasında sorulan özel form
 *
 * Mobilde: tek sütun, adım listesi -> dokununca alan listesi açılır (accordion).
 * Masaüstünde: iki panel, solda adımlar, sağda seçili adımın alanları.
 * Alan düzenleme: responsive bottom-sheet / modal (mevcut ServiceForm/StaffForm
 * ile aynı etkileşim hissi).
 *
 * Kullanım (OwnerDashboard.tsx -> Settings sekmesine eklemek için):
 *   const [showWizardBuilder, setShowWizardBuilder] = useState(false);
 *   const [builderKind, setBuilderKind] = useState<'setup_extra'|'booking'>('booking');
 *   {showWizardBuilder && (
 *     <WizardBuilder
 *       salonId={salon.id}
 *       kind={builderKind}
 *       onClose={() => setShowWizardBuilder(false)}
 *     />
 *   )}
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  Eye,
  Save,
  Type,
  Hash,
  Phone,
  Mail,
  List,
  CheckSquare,
  ToggleLeft,
  Calendar,
  Clock,
  Star,
  MapPin,
  Image as ImageIcon,
  AlignLeft,
  Info,
  Minus,
  Layers,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type WizardSchema,
  type WizardStep,
  type WizardField,
  type WizardFieldType,
  type WizardKind,
  createEmptySchema,
  createEmptyStep,
  createEmptyField,
} from '@/types/wizardSchema';
import { wizardSchemaService } from '@/services/wizardSchemaService';
import { DynamicWizardRunner } from './DynamicWizardRunner';
import { toast } from 'sonner';

const FIELD_TYPE_META: Record<WizardFieldType, { label: string; icon: any }> = {
  text: { label: 'Kısa Metin', icon: Type },
  textarea: { label: 'Uzun Metin', icon: AlignLeft },
  number: { label: 'Sayı', icon: Hash },
  phone: { label: 'Telefon', icon: Phone },
  email: { label: 'E-posta', icon: Mail },
  select: { label: 'Tek Seçim', icon: List },
  multiselect: { label: 'Çoklu Seçim', icon: CheckSquare },
  toggle: { label: 'Açık/Kapalı', icon: ToggleLeft },
  date: { label: 'Tarih', icon: Calendar },
  time: { label: 'Saat', icon: Clock },
  rating: { label: 'Puanlama', icon: Star },
  address_short: { label: 'Kısa Adres', icon: MapPin },
  image: { label: 'Görsel', icon: ImageIcon },
  divider: { label: 'Ayırıcı Çizgi', icon: Minus },
  info: { label: 'Bilgi Kutusu', icon: Info },
};

const FIELD_TYPE_ORDER: WizardFieldType[] = [
  'text',
  'textarea',
  'number',
  'phone',
  'email',
  'select',
  'multiselect',
  'toggle',
  'date',
  'time',
  'rating',
  'address_short',
  'image',
  'info',
  'divider',
];

interface WizardBuilderProps {
  salonId: string;
  kind: WizardKind;
  /** Düzenlenecek mevcut şema varsa (yoksa yeni oluşturulur) */
  existingSchema?: WizardSchema;
  onClose: () => void;
}

export function WizardBuilder({ salonId, kind, existingSchema, onClose }: WizardBuilderProps) {
  const [schema, setSchema] = useState<WizardSchema>(
    existingSchema || createEmptySchema(salonId, kind)
  );
  const [activeStepId, setActiveStepId] = useState<string | null>(schema.steps[0]?.id || null);
  const [editingField, setEditingField] = useState<{ stepId: string; field: WizardField } | null>(
    null
  );
  const [pickerForStepId, setPickerForStepId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeStep = schema.steps.find((s) => s.id === activeStepId) || null;

  const updateSchema = (updates: Partial<WizardSchema>) =>
    setSchema((prev) => ({ ...prev, ...updates }));

  const updateStep = (stepId: string, updates: Partial<WizardStep>) => {
    setSchema((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    }));
  };

  const addStep = () => {
    const step = createEmptyStep();
    setSchema((prev) => ({ ...prev, steps: [...prev.steps, step] }));
    setActiveStepId(step.id);
  };

  const removeStep = (stepId: string) => {
    if (schema.steps.length <= 1) {
      toast.error('En az bir adım kalmalı');
      return;
    }
    setSchema((prev) => ({ ...prev, steps: prev.steps.filter((s) => s.id !== stepId) }));
    if (activeStepId === stepId) setActiveStepId(schema.steps[0]?.id || null);
  };

  const moveStep = (stepId: string, dir: -1 | 1) => {
    setSchema((prev) => {
      const idx = prev.steps.findIndex((s) => s.id === stepId);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.steps.length) return prev;
      const steps = [...prev.steps];
      [steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]];
      return { ...prev, steps };
    });
  };

  const addField = (stepId: string, type: WizardFieldType) => {
    const field = createEmptyField(type);
    setSchema((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === stepId ? { ...s, fields: [...s.fields, field] } : s
      ),
    }));
    setPickerForStepId(null);
    setEditingField({ stepId, field });
  };

  const updateField = (stepId: string, fieldId: string, updates: Partial<WizardField>) => {
    setSchema((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id !== stepId
          ? s
          : { ...s, fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)) }
      ),
    }));
  };

  const removeField = (stepId: string, fieldId: string) => {
    setSchema((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id !== stepId ? s : { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
      ),
    }));
  };

  const moveField = (stepId: string, fieldId: string, dir: -1 | 1) => {
    setSchema((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => {
        if (s.id !== stepId) return s;
        const idx = s.fields.findIndex((f) => f.id === fieldId);
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= s.fields.length) return s;
        const fields = [...s.fields];
        [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
        return { ...s, fields };
      }),
    }));
  };

  const handleSave = async () => {
    if (!schema.name.trim()) {
      toast.error('Form adı boş olamaz');
      return;
    }
    const emptySteps = schema.steps.filter((s) => s.fields.length === 0);
    if (emptySteps.length > 0) {
      toast.error(`"${emptySteps[0].title}" adımında hiç alan yok`);
      return;
    }
    setSaving(true);
    try {
      await wizardSchemaService.save(salonId, schema);
      toast.success('Wizard kaydedildi');
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Kaydedilemedi, tekrar deneyin');
    } finally {
      setSaving(false);
    }
  };

  if (preview) {
    return (
      <DynamicWizardRunner
        schema={schema}
        previewMode
        onComplete={() => setPreview(false)}
        onClose={() => setPreview(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[99998] bg-[var(--void)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-8 py-3 border-b border-white/[0.08] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Layers size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <input
              value={schema.name}
              onChange={(e) => updateSchema({ name: e.target.value })}
              placeholder="Form adı"
              className="font-heading font-bold text-base sm:text-lg text-[var(--chrome-white)] bg-transparent outline-none border-b border-transparent focus:border-purple-500/50 w-full"
            />
            <p className="text-[11px] text-[var(--muted-lead)]">
              {kind === 'booking'
                ? 'Müşteriye rezervasyon sırasında gösterilir'
                : 'İşletme profili sihirbazına ek adım olarak eklenir'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setPreview(true)}
            className="px-3 sm:px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 text-xs sm:text-sm font-heading font-semibold text-white transition-all"
          >
            <Eye size={15} />
            <span className="hidden sm:inline">Önizle</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 flex items-center gap-1.5 text-xs sm:text-sm font-heading font-bold text-white shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.08] flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X size={18} className="text-[var(--muted-lead)]" />
          </button>
        </div>
      </div>

      {/* Body: responsive two-pane */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Adım listesi */}
        <div className="lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[40vh] lg:max-h-none">
          {schema.steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActiveStepId(step.id)}
              className={cn(
                'w-full text-left p-3.5 rounded-2xl border transition-all group',
                activeStepId === step.id
                  ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/15 to-pink-500/10'
                  : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-[var(--chrome-white)] flex-shrink-0">
                    {i + 1}
                  </span>
                  <input
                    value={step.title}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    className="bg-transparent outline-none font-heading font-semibold text-sm text-[var(--chrome-white)] min-w-0 w-full"
                  />
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <IconBtn
                    icon={ChevronUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveStep(step.id, -1);
                    }}
                  />
                  <IconBtn
                    icon={ChevronDown}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveStep(step.id, 1);
                    }}
                  />
                  <IconBtn
                    icon={Trash2}
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(step.id);
                    }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-[var(--muted-lead)] mt-1 ml-8">
                {step.fields.length} alan
              </p>
            </button>
          ))}
          <button
            onClick={addStep}
            className="w-full p-3.5 rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/40 hover:bg-white/[0.03] flex items-center justify-center gap-2 text-sm font-heading font-semibold text-[var(--muted-lead)] transition-all"
          >
            <Plus size={16} /> Adım Ekle
          </button>
        </div>

        {/* Alan listesi (seçili adım) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3">
          {!activeStep ? (
            <p className="text-sm text-[var(--muted-lead)] text-center mt-10">
              Düzenlemek için soldan bir adım seçin
            </p>
          ) : (
            <>
              <textarea
                value={activeStep.subtitle || ''}
                onChange={(e) => updateStep(activeStep.id, { subtitle: e.target.value })}
                placeholder="Bu adım için açıklama (opsiyonel) — örn. 'Kaç kişi geleceğinizi ve özel isteklerinizi belirtin'"
                rows={2}
                className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-sm text-[var(--chrome-white)] placeholder:text-[var(--ash)] outline-none focus:border-purple-500/40 resize-none"
              />

              {activeStep.fields.length === 0 && (
                <div className="p-8 rounded-3xl border-2 border-dashed border-white/10 text-center">
                  <p className="text-sm text-[var(--muted-lead)]">Bu adımda henüz alan yok</p>
                </div>
              )}

              {activeStep.fields.map((field) => {
                const meta = FIELD_TYPE_META[field.type];
                const Icon = meta.icon;
                return (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center gap-3"
                  >
                    <GripVertical size={16} className="text-white/20 flex-shrink-0 hidden sm:block" />
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-heading font-semibold text-[var(--chrome-white)] truncate">
                        {field.label || <span className="text-[var(--ash)]">(Etiketsiz alan)</span>}
                      </p>
                      <p className="text-[11px] text-[var(--muted-lead)]">
                        {meta.label}
                        {field.required && ' • Zorunlu'}
                        {field.visibleIf && field.visibleIf.length > 0 && ' • Koşullu'}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <IconBtn icon={ChevronUp} onClick={() => moveField(activeStep.id, field.id, -1)} />
                      <IconBtn icon={ChevronDown} onClick={() => moveField(activeStep.id, field.id, 1)} />
                      <IconBtn
                        icon={Pencil}
                        onClick={() => setEditingField({ stepId: activeStep.id, field })}
                      />
                      <IconBtn
                        icon={Trash2}
                        danger
                        onClick={() => removeField(activeStep.id, field.id)}
                      />
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => setPickerForStepId(activeStep.id)}
                className="w-full p-3.5 rounded-2xl border-2 border-dashed border-white/15 hover:border-cyan-500/40 hover:bg-white/[0.03] flex items-center justify-center gap-2 text-sm font-heading font-semibold text-[var(--muted-lead)] transition-all"
              >
                <Plus size={16} /> Alan Ekle
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alan tipi seçici */}
      <AnimatePresence>
        {pickerForStepId && (
          <BottomSheet onClose={() => setPickerForStepId(null)} title="Alan Tipi Seç">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {FIELD_TYPE_ORDER.map((type) => {
                const meta = FIELD_TYPE_META[type];
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    onClick={() => addField(pickerForStepId, type)}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/40 hover:bg-white/[0.06] flex flex-col items-center gap-2 transition-all"
                  >
                    <Icon size={20} className="text-purple-400" />
                    <span className="text-[11px] font-heading font-semibold text-[var(--chrome-white)] text-center leading-tight">
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* Alan editörü */}
      <AnimatePresence>
        {editingField && (
          <FieldEditorSheet
            allStepFields={schema.steps.find((s) => s.id === editingField.stepId)?.fields || []}
            field={editingField.field}
            onChange={(updates) => updateField(editingField.stepId, editingField.field.id, updates)}
            onClose={() => setEditingField(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
function IconBtn({
  icon: Icon,
  onClick,
  danger,
}: {
  icon: any;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
        danger ? 'hover:bg-red-500/15 text-red-400/70 hover:text-red-400' : 'hover:bg-white/10 text-[var(--muted-lead)] hover:text-white'
      )}
    >
      <Icon size={14} />
    </button>
  );
}

function BottomSheet({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100000] bg-black/60 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl bg-[var(--void)] border border-white/[0.08] max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-[var(--void)] px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <h4 className="font-heading font-bold text-base text-[var(--chrome-white)]">{title}</h4>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X size={16} className="text-[var(--muted-lead)]" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function FieldEditorSheet({
  field,
  allStepFields,
  onChange,
  onClose,
}: {
  field: WizardField;
  allStepFields: WizardField[];
  onChange: (updates: Partial<WizardField>) => void;
  onClose: () => void;
}) {
  const needsOptions = field.type === 'select' || field.type === 'multiselect';
  const otherFields = allStepFields.filter((f) => f.id !== field.id && f.type === 'toggle');
  const inputClass =
    'w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm outline-none focus:border-purple-500/50';

  const addOption = () =>
    onChange({
      options: [
        ...(field.options || []),
        { id: `o_${Date.now()}`, label: '' },
      ],
    });

  const updateOption = (id: string, label: string) =>
    onChange({ options: (field.options || []).map((o) => (o.id === id ? { ...o, label } : o)) });

  const removeOption = (id: string) =>
    onChange({ options: (field.options || []).filter((o) => o.id !== id) });

  return (
    <BottomSheet onClose={onClose} title={`Alanı Düzenle — ${FIELD_TYPE_META[field.type].label}`}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-heading font-semibold text-[var(--muted-lead)] mb-1.5 block">
            Etiket (müşteriye görünecek soru)
          </label>
          <input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="örn. Kaç kişi geleceksiniz?"
            className={inputClass}
          />
        </div>

        {field.type === 'info' ? (
          <div>
            <label className="text-xs font-heading font-semibold text-[var(--muted-lead)] mb-1.5 block">
              Bilgi metni
            </label>
            <textarea
              value={field.infoText || ''}
              onChange={(e) => onChange({ infoText: e.target.value })}
              rows={2}
              className={cn(inputClass, 'h-auto py-2.5 resize-none')}
            />
          </div>
        ) : field.type !== 'divider' ? (
          <>
            <div>
              <label className="text-xs font-heading font-semibold text-[var(--muted-lead)] mb-1.5 block">
                Yardımcı açıklama (opsiyonel)
              </label>
              <input
                value={field.helpText || ''}
                onChange={(e) => onChange({ helpText: e.target.value })}
                className={inputClass}
              />
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] cursor-pointer">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onChange({ required: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-[var(--chrome-white)]">Bu alan zorunlu olsun</span>
            </label>

            {field.type === 'number' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-semibold text-[var(--muted-lead)] mb-1.5 block">Min</label>
                  <input
                    type="number"
                    value={field.min ?? ''}
                    onChange={(e) => onChange({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-semibold text-[var(--muted-lead)] mb-1.5 block">Max</label>
                  <input
                    type="number"
                    value={field.max ?? ''}
                    onChange={(e) => onChange({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {needsOptions && (
              <div>
                <label className="text-xs font-heading font-semibold text-[var(--muted-lead)] mb-1.5 block">
                  Seçenekler
                </label>
                <div className="space-y-2">
                  {(field.options || []).map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        value={opt.label}
                        onChange={(e) => updateOption(opt.id, e.target.value)}
                        placeholder="Seçenek adı"
                        className={inputClass}
                      />
                      <button
                        onClick={() => removeOption(opt.id)}
                        className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addOption}
                    className="w-full py-2.5 rounded-xl border border-dashed border-white/15 text-xs font-heading font-semibold text-[var(--muted-lead)] hover:bg-white/[0.03]"
                  >
                    + Seçenek Ekle
                  </button>
                </div>
              </div>
            )}

            {otherFields.length > 0 && (
              <div>
                <label className="text-xs font-heading font-semibold text-[var(--muted-lead)] mb-1.5 block">
                  Koşullu görünürlük (opsiyonel)
                </label>
                <p className="text-[11px] text-[var(--muted-lead)] mb-2">
                  Bu alanı sadece belirli bir açık/kapalı sorusu işaretlendiğinde göster
                </p>
                <select
                  value={field.visibleIf?.[0]?.fieldId || ''}
                  onChange={(e) =>
                    onChange({
                      visibleIf: e.target.value
                        ? [{ fieldId: e.target.value, operator: 'truthy' }]
                        : undefined,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Her zaman göster</option>
                  {otherFields.map((f) => (
                    <option key={f.id} value={f.id}>
                      "{f.label || 'Etiketsiz'}" işaretlenirse göster
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        ) : null}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-heading font-bold text-sm"
        >
          Tamam
        </button>
      </div>
    </BottomSheet>
  );
}
