import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Image as ImageIcon, X, Save, Package, TrendingUp, DollarSign, Clock, Eye, EyeOff, ChefHat, Sparkles, Check, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRestaurantStore } from '@/store/restaurantStore';
import { restaurantService } from '@/services/restaurantService';
import { storageService } from '@/services/storageService';
import { soundService } from '@/services/soundService';
import type { MenuItem, MenuCategory, ProductIngredient, ProductExtra } from '@/types/restaurant';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  restaurantId: string;
}

export function MenuManagement({ restaurantId }: Props) {
  const { categories, menuItems, setCategories, setMenuItems } = useRestaurantStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemPreparationTime, setItemPreparationTime] = useState('30');
  const [ingredients, setIngredients] = useState<ProductIngredient[]>([]);
  const [availableExtras, setAvailableExtras] = useState<ProductExtra[]>([]);

  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  
  // Ingredient form states
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientRemovable, setNewIngredientRemovable] = useState(true);
  
  // Extra form states
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, items] = await Promise.all([
        restaurantService.getCategories(restaurantId),
        restaurantService.getMenuItems(restaurantId),
      ]);
      setCategories(cats);
      setMenuItems(items);
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File type validation
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece görsel dosyaları yükleyebilirsiniz!', {
        description: 'JPG, PNG veya WebP formatında dosya seçin.'
      });
      return;
    }

    // File size validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu çok büyük!', {
        description: 'Maksimum 5MB boyutunda dosya yükleyebilirsiniz.'
      });
      return;
    }

    try {
      const toastId = toast.loading('Görsel Cloudflare R2\'ye yükleniyor...', {
        description: 'Lütfen bekleyin, görsel optimize ediliyor...'
      });
      
      // R2'ye yükle (otomatik aggressive compression ile)
      const result = await storageService.uploadFile(file, {
        folder: 'menu-items',
        compress: true,
        maxWidth: 1280,  // R2-optimized
        maxHeight: 720,  // R2-optimized
        quality: 0.70    // Aggressive compression
      });
      
      setItemImage(result.url); // ✅ R2 PUBLIC URL
      soundService.play('success');
      
      const provider = storageService.getProvider();
      const providerName = provider === 'r2' ? 'Cloudflare R2' : 'Firebase Storage';
      const savedSize = ((1 - result.size / file.size) * 100).toFixed(0);
      
      toast.success(`Görsel ${providerName}'a yüklendi!`, { 
        id: toastId,
        icon: <Cloud className="w-5 h-5" />,
        description: `${savedSize}% daha küçük (${(result.size / 1024).toFixed(0)}KB)`
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      soundService.play('error');
      toast.error('Görsel yüklenemedi!', { 
        description: error.message || 'Bir hata oluştu, lütfen tekrar deneyin.'
      });
    }
  };

  const handleSaveItem = async () => {
    console.log('='.repeat(50));
    console.log('🔵 KAYDET BUTONUNA TIKLANDI');
    console.log('='.repeat(50));
    console.log('📋 Form Durumu:');
    console.log('  - itemName:', itemName);
    console.log('  - itemPrice:', itemPrice);
    console.log('  - selectedCategory:', selectedCategory);
    console.log('  - restaurantId:', restaurantId);
    console.log('  - itemDescription:', itemDescription);
    console.log('  - itemImage:', itemImage);
    console.log('  - categories:', categories);
    console.log('='.repeat(50));
    
    // Validation kontrolü
    const validationErrors = [];
    if (!itemName?.trim()) validationErrors.push('Ürün adı boş');
    if (!itemPrice || parseFloat(itemPrice) <= 0) validationErrors.push('Geçerli bir fiyat girin');
    if (!selectedCategory) {
      validationErrors.push('Kategori seçilmemiş');
      // Eğer kategori yoksa ve kategoriler varsa, ilkini seç
      if (categories.length > 0) {
        console.log('🔧 Kategori otomatik seçiliyor:', categories[0].id);
        setSelectedCategory(categories[0].id);
        toast.info('Kategori otomatik seçildi, lütfen tekrar kaydet butonuna basın.', {
          duration: 4000
        });
        return;
      } else {
        toast.error('Önce bir kategori eklemelisiniz!', {
          description: 'Ürün eklemeden önce en az bir kategori oluşturun.',
          duration: 5000
        });
        return;
      }
    }
    
    if (validationErrors.length > 0) {
      console.error('❌ VALIDATION HATASI:', validationErrors);
      soundService.play('error');
      toast.error('Lütfen tüm zorunlu alanları doldurun!', {
        description: validationErrors.join(', '),
        duration: 5000
      });
      return;
    }

    console.log('✅ Validation başarılı, kaydetmeye devam ediliyor...');

    try {
      // ✅ ABONELIK LİMİT KONTROLÜ - Yeni menü ürünü eklenirken
      if (!editingItem) {
        const { subscriptionService } = await import('@/services/subscriptionService');
        const subscription = await subscriptionService.getBusinessSubscription(restaurantId);
        
        if (!subscription || subscription.status !== 'active') {
          toast.error('Aktif aboneliğiniz yok', {
            description: 'Menü ürünü eklemek için aktif bir aboneliğe ihtiyacınız var',
            duration: 5000,
          });
          return;
        }

        // Plan özelliklerini al
        const plan = subscription.customFeatures || 
          (await import('@/config/restaurantSubscriptionPlans')).RESTAURANT_SUBSCRIPTION_PLANS.find(p => p.id === subscription.planType)?.features;
        
        if (!plan) {
          toast.error('Plan bilgisi bulunamadı');
          return;
        }

        const maxMenuItems = plan.maxMenuItems;
        const currentItemCount = menuItems.length;

        // Limit kontrolü
        if (maxMenuItems !== 'unlimited' && currentItemCount >= maxMenuItems) {
          toast.error(`Menü ürünü limiti aşıldı!`, {
            description: `${subscription.planType.toUpperCase()} paketinizde maksimum ${maxMenuItems} ürün ekleyebilirsiniz. Daha fazla ürün için paketinizi yükseltin.`,
            duration: 7000,
            action: {
              label: 'Paketi Yükselt',
              onClick: () => {
                window.location.href = '/owner-dashboard?tab=subscription';
              }
            }
          });
          return;
        }

        // Kategori limiti kontrolü
        if (plan.maxCategories && plan.maxCategories !== 'unlimited') {
          const currentCategoryCount = categories.length;
          if (currentCategoryCount >= plan.maxCategories) {
            // Yeni kategori mi ekleniyor kontrol et
            const isNewCategory = !categories.find(c => c.id === selectedCategory);
            if (isNewCategory) {
              toast.error(`Kategori limiti aşıldı!`, {
                description: `${subscription.planType.toUpperCase()} paketinizde maksimum ${plan.maxCategories} kategori oluşturabilirsiniz.`,
                duration: 7000,
              });
              return;
            }
          }
        }
      }

      const itemData = {
        categoryId: selectedCategory,
        name: itemName,
        description: itemDescription,
        price: parseFloat(itemPrice),
        image: itemImage,
        ingredients,
        availableExtras,
        preparationTime: parseInt(itemPreparationTime),
        isActive: true,
        isAvailable: true,
        displayOrder: menuItems.length,
      };

      console.log('📦 Kaydedilecek veri:', JSON.stringify(itemData, null, 2));

      if (editingItem) {
        console.log('✏️ Güncelleme modu - Item ID:', editingItem.id);
        await restaurantService.updateMenuItem(editingItem.id, itemData);
        console.log('✅ Güncelleme başarılı!');
        toast.success('Ürün güncellendi!', {
          description: `${itemName} başarıyla güncellendi.`,
          icon: <Check className="w-5 h-5" />,
          duration: 3000
        });
      } else {
        console.log('➕ Yeni ekleme modu');
        const newId = await restaurantService.createMenuItem(restaurantId, itemData);
        console.log('✅ Ekleme başarılı! Yeni ID:', newId);
        toast.success('Ürün eklendi!', {
          description: `${itemName} menünüze eklendi.`,
          icon: <Check className="w-5 h-5" />,
          duration: 3000
        });
      }

      soundService.play('success');
      console.log('🔄 Form sıfırlanıyor ve modal kapatılıyor...');
      resetForm();
      setShowItemModal(false);
      loadData();
      console.log('✅ İşlem tamamlandı!');
    } catch (error) {
      console.error('❌ KAYDETME HATASI:', error);
      console.error('Hata detayı:', JSON.stringify(error, null, 2));
      soundService.play('error');
      toast.error('Ürün kaydedilemedi!', {
        description: 'Bir hata oluştu, lütfen tekrar deneyin.'
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    
    if (!confirm(`"${item?.name || 'Bu ürün'}" ürününü silmek istediğinize emin misiniz?`)) {
      return;
    }
    
    try {
      // 🗑️ R2'den görseli sil (eğer varsa)
      if (item?.image && !item.image.startsWith('data:')) {
        try {
          // URL'den path'i çıkar (örn: https://pub-xxx.r2.dev/menu-items/123.jpg → menu-items/123.jpg)
          const urlObj = new URL(item.image);
          const r2Path = urlObj.pathname.substring(1); // Remove leading slash
          
          console.log(`🗑️ R2'den görsel siliniyor: ${r2Path}`);
          await storageService.deleteFile(r2Path, 'r2');
          console.log('✅ R2 görseli silindi');
        } catch (deleteError) {
          console.warn('⚠️ R2 görseli silinemedi (devam ediliyor):', deleteError);
          // Don't block deletion if R2 cleanup fails
        }
      }
      
      // Firestore'dan ürünü sil
      await restaurantService.deleteMenuItem(itemId);
      soundService.play('success');
      toast.success('Ürün silindi!', {
        description: `${item?.name || 'Ürün'} menünüzden kaldırıldı.`,
        icon: <Check className="w-5 h-5" />
      });
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      soundService.play('error');
      toast.error('Ürün silinemedi!', {
        description: 'Bir hata oluştu, lütfen tekrar deneyin.'
      });
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName) {
      soundService.play('error');
      toast.error('Kategori adı gerekli!', {
        description: 'Lütfen kategori adını girin.'
      });
      return;
    }

    try {
      await restaurantService.createCategory(restaurantId, {
        name: categoryName,
        description: categoryDescription,
        displayOrder: categories.length,
        isActive: true,
      });

      soundService.play('success');
      toast.success('Kategori eklendi!', {
        description: `${categoryName} kategorisi oluşturuldu.`,
        icon: <Check className="w-5 h-5" />
      });
      setCategoryName('');
      setCategoryDescription('');
      setShowCategoryModal(false);
      loadData();
    } catch (error) {
      console.error('Kategori kaydetme hatası:', error);
      soundService.play('error');
      toast.error('Kategori kaydedilemedi!', {
        description: 'Bir hata oluştu, lütfen tekrar deneyin.'
      });
    }
  };

  const resetForm = () => {
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemImage('');
    setItemPreparationTime('30');
    setIngredients([]);
    setAvailableExtras([]);
    setEditingItem(null);
    setShowIngredientForm(false);
    setShowExtraForm(false);
    setNewIngredientName('');
    setNewIngredientRemovable(true);
    setNewExtraName('');
    setNewExtraPrice('');
  };

  const addIngredient = () => {
    if (!newIngredientName.trim()) {
      return;
    }
    
    setIngredients([...ingredients, {
      id: Date.now().toString(),
      name: newIngredientName.trim(),
      removable: newIngredientRemovable,
    }]);
    
    // Reset form
    setNewIngredientName('');
    setNewIngredientRemovable(true);
    setShowIngredientForm(false);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  const addExtra = () => {
    if (!newExtraName.trim() || !newExtraPrice) {
      return;
    }

    setAvailableExtras([...availableExtras, {
      id: Date.now().toString(),
      name: newExtraName.trim(),
      price: parseFloat(newExtraPrice),
    }]);
    
    // Reset form
    setNewExtraName('');
    setNewExtraPrice('');
    setShowExtraForm(false);
  };

  const removeExtra = (id: string) => {
    setAvailableExtras(availableExtras.filter(e => e.id !== id));
  };

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.categoryId === selectedCategory)
    : menuItems;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 dark:border-purple-400 border-t-transparent rounded-full mb-4"
        />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Menü yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl sm:text-3xl font-heading font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-1"
            >
              Menü Yönetimi
            </motion.h2>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ürünlerinizi, kategorilerinizi ve menünüzü yönetin</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCategoryModal(true)}
              className="px-5 py-3 bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl shadow-sm font-heading font-bold text-sm flex items-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Kategori Ekle
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                resetForm();
                // Kategori seçili değilse ve kategoriler varsa, ilkini seç
                if (!selectedCategory && categories.length > 0) {
                  setSelectedCategory(categories[0].id);
                }
                setShowItemModal(true);
              }}
              className="px-5 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl shadow-lg shadow-orange-500/20 font-heading font-bold text-sm flex items-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Ürün Ekle
            </motion.button>
          </div>
        </div>

        {/* Stats Cards - Clean Minimal */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Ürün', value: menuItems.length, icon: Package, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Aktif Ürünler', value: menuItems.filter(i => i.isActive && i.isAvailable).length, icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
            { label: 'Ortalama Fiyat', value: `${menuItems.length > 0 ? (menuItems.reduce((sum, i) => sum + i.price, 0) / menuItems.length).toFixed(0) : 0}₺`, icon: DollarSign, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'Kategoriler', value: categories.length, icon: ChefHat, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                'p-5 rounded-2xl transition-all',
                'bg-white dark:bg-white/[0.03]',
                'border border-gray-200/80 dark:border-white/10',
                'hover:border-gray-300 dark:hover:border-white/20',
                'shadow-sm hover:shadow-md dark:shadow-none'
              )}
            >
              <div className={cn('inline-flex p-3 rounded-xl mb-3', stat.bg)}>
                <stat.icon className={cn('w-5 h-5', stat.color)} strokeWidth={2.5} />
              </div>
              <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Categories - Clean Modern Tabs with Delete */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category, idx) => {
            const itemsInCategory = menuItems.filter(i => i.categoryId === category.id).length;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="relative group"
              >
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'relative px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-heading font-bold whitespace-nowrap transition-all',
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                  )}
                >
                  <span className="text-sm sm:text-base">{category.name}</span>
                  <span className={cn(
                    'ml-2 text-xs px-2 py-0.5 rounded-full',
                    selectedCategory === category.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                  )}>
                    {itemsInCategory}
                  </span>
                </button>
                
                {/* Delete Button - Show on hover */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (itemsInCategory > 0) {
                      toast.error('Bu kategoride ürün var!', {
                        description: 'Önce kategorideki ürünleri silin.'
                      });
                      return;
                    }
                    if (confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) {
                      try {
                        await restaurantService.deleteCategory(category.id);
                        soundService.play('success');
                        toast.success('Kategori silindi!');
                        loadData();
                      } catch (error) {
                        console.error('Kategori silme hatası:', error);
                        soundService.play('error');
                        toast.error('Kategori silinemedi!');
                      }
                    }
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Menu Items - Premium Grid with Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.03 }}
              layout
              className="group relative"
            >
              {/* Hover Glow - Subtle */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Card */}
              <div className={cn(
                'relative rounded-3xl overflow-hidden transition-all duration-300',
                'bg-white dark:bg-white/[0.03]',
                'border border-gray-200/80 dark:border-white/10',
                'hover:border-gray-300 dark:hover:border-white/20',
                'shadow-lg shadow-black/5 dark:shadow-none',
                'group-hover:scale-[1.02]'
              )}>
                {/* Image */}
                {item.image ? (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {item.isAvailable ? (
                        <span className="px-3 py-1.5 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <Eye className="w-3.5 h-3.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <EyeOff className="w-3.5 h-3.5" />
                          Pasif
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/5 dark:to-white/[0.02] flex items-center justify-center relative overflow-hidden">
                    <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 relative z-10" />
                  </div>
                )}
                
                {/* Content */}
                <div className="p-5">
                  {/* Switch Toggle - Top Right */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-1">
                      {item.name}
                    </h3>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await restaurantService.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
                          soundService.play('success');
                          toast.success(item.isAvailable ? 'Ürün pasif edildi' : 'Ürün aktif edildi');
                          loadData();
                        } catch (error) {
                          console.error('Durum güncelleme hatası:', error);
                          soundService.play('error');
                          toast.error('Durum güncellenemedi');
                        }
                      }}
                      className="relative ml-3 flex-shrink-0"
                    >
                      <div className={cn(
                        'w-12 h-7 rounded-full transition-all',
                        item.isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      )}>
                        <div className={cn(
                          'w-5 h-5 rounded-full bg-white shadow-lg transition-all absolute top-1',
                          item.isAvailable ? 'left-6' : 'left-1'
                        )} />
                      </div>
                    </button>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  {/* Info Row */}
                  <div className="flex items-center gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{item.preparationTime}dk</span>
                    </div>
                    {item.ingredients.length > 0 && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <ChefHat className="w-4 h-4" />
                        <span>{item.ingredients.length} malzeme</span>
                      </div>
                    )}
                    {item.availableExtras.length > 0 && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Sparkles className="w-4 h-4" />
                        <span>{item.availableExtras.length} ekstra</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-heading font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                        {item.price}₺
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setItemName(item.name);
                          setItemDescription(item.description || '');
                          setItemPrice(item.price.toString());
                          setItemImage(item.image || '');
                          setItemPreparationTime(item.preparationTime.toString());
                          setIngredients(item.ingredients);
                          setAvailableExtras(item.availableExtras);
                          setShowItemModal(true);
                        }}
                        className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all hover:scale-110"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State - Theme-aware */}
      {filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'text-center py-16 px-6 rounded-3xl',
            'bg-white dark:bg-white/[0.03]',
            'border-2 border-dashed border-gray-300 dark:border-white/10'
          )}
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-500/10 dark:to-pink-500/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
            Bu kategoride ürün yok
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            İlk ürünü ekleyerek başlayın
          </p>
          <Button
            onClick={() => {
              resetForm();
              // Kategori seçili değilse ve kategoriler varsa, ilkini seç
              if (!selectedCategory && categories.length > 0) {
                setSelectedCategory(categories[0].id);
              }
              setShowItemModal(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            İlk Ürünü Ekle
          </Button>
        </motion.div>
      )}

      {/* Item Modal - Modern Theme-aware */}
      <AnimatePresence>
        {showItemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
            onClick={() => setShowItemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto',
                'bg-white dark:bg-[#0a0a0a]',
                'border border-gray-200 dark:border-white/10',
                'shadow-2xl'
              )}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  {editingItem ? (
                    <Edit className="w-5 h-5 text-white" strokeWidth={2.5} />
                  ) : (
                    <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                  )}
                </div>
                <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                  {editingItem ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                </h3>
              </div>

              <div className="space-y-5">
                {/* Kategori Seçimi */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">Kategori *</label>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={cn(
                      'w-full px-4 py-3 rounded-2xl font-medium transition-all appearance-none cursor-pointer',
                      'bg-gray-50 dark:bg-white/5',
                      'border-2 border-gray-200 dark:border-white/10',
                      'focus:border-purple-500 dark:focus:border-purple-500 focus:ring-0',
                      'text-gray-900 dark:text-white',
                      !selectedCategory && 'text-gray-500 dark:text-gray-500'
                    )}
                  >
                    <option value="" disabled>Kategori seçin...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Önce bir kategori eklemelisiniz!</span>
                    </p>
                  )}
                </div>

                {/* Görsel */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">Ürün Görseli</label>
                  {itemImage ? (
                    <div className="relative group">
                      <img src={itemImage} alt="Preview" className="w-full h-64 object-cover rounded-2xl border-2 border-gray-200 dark:border-white/10" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
                        <label className="cursor-pointer px-4 py-2 bg-white/90 dark:bg-black/90 rounded-xl font-bold text-sm hover:bg-white dark:hover:bg-black transition-colors">
                          <span className="text-gray-900 dark:text-white">Değiştir</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        <button
                          onClick={() => setItemImage('')}
                          className="px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-colors"
                        >
                          Kaldır
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl p-12 text-center hover:border-purple-500 dark:hover:border-purple-500 transition-all bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-500/10 dark:hover:to-pink-500/10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-500/20 dark:to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Görsel Yükle</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">veya sürükleyip bırakın</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Ad */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Ürün Adı *</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Örn: Adana Kebap"
                    className={cn(
                      'w-full px-4 py-3 rounded-2xl font-medium transition-all',
                      'bg-gray-50 dark:bg-white/5',
                      'border-2 border-gray-200 dark:border-white/10',
                      'focus:border-purple-500 dark:focus:border-purple-500 focus:ring-0',
                      'text-gray-900 dark:text-white',
                      'placeholder-gray-500 dark:placeholder-gray-500'
                    )}
                  />
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Açıklama</label>
                  <textarea
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Ürün hakkında kısa açıklama..."
                    rows={3}
                    className={cn(
                      'w-full px-4 py-3 rounded-2xl font-medium transition-all resize-none',
                      'bg-gray-50 dark:bg-white/5',
                      'border-2 border-gray-200 dark:border-white/10',
                      'focus:border-purple-500 dark:focus:border-purple-500 focus:ring-0',
                      'text-gray-900 dark:text-white',
                      'placeholder-gray-500 dark:placeholder-gray-500'
                    )}
                  />
                </div>

                {/* Fiyat ve Süre */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Fiyat (₺) *</label>
                    <input
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="0.00"
                      className={cn(
                        'w-full px-4 py-3 rounded-2xl font-mono font-bold text-lg transition-all',
                        'bg-gray-50 dark:bg-white/5',
                        'border-2 border-gray-200 dark:border-white/10',
                        'focus:border-purple-500 dark:focus:border-purple-500 focus:ring-0',
                        'text-gray-900 dark:text-white',
                        'placeholder-gray-500 dark:placeholder-gray-500'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Hazırlık (dk) *</label>
                    <input
                      type="number"
                      value={itemPreparationTime}
                      onChange={(e) => setItemPreparationTime(e.target.value)}
                      placeholder="30"
                      className={cn(
                        'w-full px-4 py-3 rounded-2xl font-mono font-bold text-lg transition-all',
                        'bg-gray-50 dark:bg-white/5',
                        'border-2 border-gray-200 dark:border-white/10',
                        'focus:border-purple-500 dark:focus:border-purple-500 focus:ring-0',
                        'text-gray-900 dark:text-white',
                        'placeholder-gray-500 dark:placeholder-gray-500'
                      )}
                    />
                  </div>
                </div>

                {/* Malzemeler - Clean Modern */}
                <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <ChefHat className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                      <label className="text-base font-bold text-green-900 dark:text-green-400">
                        İçindekiler
                      </label>
                    </div>
                    {!showIngredientForm && (
                      <button
                        onClick={() => setShowIngredientForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:scale-105 flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Ekle
                      </button>
                    )}
                  </div>

                  {/* Add Ingredient Form */}
                  <AnimatePresence>
                    {showIngredientForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                      >
                        <div className="p-4 rounded-2xl bg-white dark:bg-white/10 border-2 border-green-300 dark:border-green-500/30 space-y-3">
                          <input
                            type="text"
                            value={newIngredientName}
                            onChange={(e) => setNewIngredientName(e.target.value)}
                            placeholder="Malzeme adı (örn: Domates, Biber)"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 focus:border-green-500 dark:focus:border-green-500 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 font-medium transition-all"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addIngredient();
                              }
                            }}
                          />
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={newIngredientRemovable}
                                onChange={(e) => setNewIngredientRemovable(e.target.checked)}
                                className="sr-only"
                              />
                              <div className={cn(
                                'w-12 h-7 rounded-full transition-all',
                                newIngredientRemovable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                              )}>
                                <div className={cn(
                                  'w-5 h-5 rounded-full bg-white shadow-lg transition-all absolute top-1',
                                  newIngredientRemovable ? 'left-6' : 'left-1'
                                )} />
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              Müşteri çıkarabilir
                            </span>
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setShowIngredientForm(false);
                                setNewIngredientName('');
                                setNewIngredientRemovable(true);
                              }}
                              className="flex-1 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 transition-all"
                            >
                              İptal
                            </button>
                            <button
                              onClick={addIngredient}
                              disabled={!newIngredientName.trim()}
                              className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" strokeWidth={2.5} />
                              Ekle
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Ingredients List */}
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {ingredients.map((ingredient, idx) => (
                        <motion.div
                          key={ingredient.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center justify-between p-3 bg-white dark:bg-white/10 rounded-xl border border-green-200 dark:border-green-500/20 group hover:border-green-300 dark:hover:border-green-500/30 transition-all"
                        >
                          <div className="flex items-center gap-2.5 flex-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {ingredient.name}
                            </span>
                            {ingredient.removable && (
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                                Çıkarılabilir
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeIngredient(ingredient.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {ingredients.length === 0 && !showIngredientForm && (
                      <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-6">
                        Henüz malzeme eklenmedi
                      </p>
                    )}
                  </div>
                </div>

                {/* Ekstralar - Clean Modern */}
                <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                      <label className="text-base font-bold text-purple-900 dark:text-purple-400">
                        Eklenebilir Ekstralar
                      </label>
                    </div>
                    {!showExtraForm && (
                      <button
                        onClick={() => setShowExtraForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:scale-105 flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Ekle
                      </button>
                    )}
                  </div>

                  {/* Add Extra Form */}
                  <AnimatePresence>
                    {showExtraForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                      >
                        <div className="p-4 rounded-2xl bg-white dark:bg-white/10 border-2 border-purple-300 dark:border-purple-500/30 space-y-3">
                          <input
                            type="text"
                            value={newExtraName}
                            onChange={(e) => setNewExtraName(e.target.value)}
                            placeholder="Ekstra adı (örn: Ekstra Peynir, Acı Sos)"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 font-medium transition-all"
                            autoFocus
                          />
                          <div className="relative">
                            <input
                              type="number"
                              value={newExtraPrice}
                              onChange={(e) => setNewExtraPrice(e.target.value)}
                              placeholder="0"
                              step="0.01"
                              className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 font-mono font-bold text-lg transition-all"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addExtra();
                                }
                              }}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500 dark:text-gray-400">₺</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setShowExtraForm(false);
                                setNewExtraName('');
                                setNewExtraPrice('');
                              }}
                              className="flex-1 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 transition-all"
                            >
                              İptal
                            </button>
                            <button
                              onClick={addExtra}
                              disabled={!newExtraName.trim() || !newExtraPrice}
                              className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" strokeWidth={2.5} />
                              Ekle
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Extras List */}
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {availableExtras.map((extra, idx) => (
                        <motion.div
                          key={extra.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center justify-between p-3 bg-white dark:bg-white/10 rounded-xl border border-purple-200 dark:border-purple-500/20 group hover:border-purple-300 dark:hover:border-purple-500/30 transition-all"
                        >
                          <div className="flex items-center gap-2.5 flex-1">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {extra.name}
                            </span>
                            <span className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-500/20 dark:to-pink-500/20 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-full">
                              +{extra.price}₺
                            </span>
                          </div>
                          <button
                            onClick={() => removeExtra(extra.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {availableExtras.length === 0 && !showExtraForm && (
                      <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-6">
                        Henüz ekstra eklenmedi
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowItemModal(false);
                  }}
                  className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-2xl font-bold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('🟢🟢🟢 KAYDET BUTONU TIKLANDI - EVENT TETIKLENDI 🟢🟢🟢');
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Event önlendi ve propagation durduruldu');
                    console.log('handleSaveItem fonksiyonu çağrılıyor...');
                    handleSaveItem();
                  }}
                  className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                >
                  <Save className="w-5 h-5" />
                  Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Modal - Modern Theme-aware */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'rounded-3xl p-6 max-w-md w-full',
                'bg-white dark:bg-[#0a0a0a]',
                'border border-gray-200 dark:border-white/10',
                'shadow-2xl'
              )}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white">Yeni Kategori Ekle</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Kategori Adı *</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Örn: Kebaplar, İçecekler, Tatlılar"
                    className={cn(
                      'w-full px-4 py-3 rounded-2xl font-medium transition-all',
                      'bg-gray-50 dark:bg-white/5',
                      'border-2 border-gray-200 dark:border-white/10',
                      'focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0',
                      'text-gray-900 dark:text-white',
                      'placeholder-gray-500 dark:placeholder-gray-500'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Açıklama</label>
                  <textarea
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="Kategori hakkında kısa açıklama..."
                    rows={3}
                    className={cn(
                      'w-full px-4 py-3 rounded-2xl font-medium transition-all resize-none',
                      'bg-gray-50 dark:bg-white/5',
                      'border-2 border-gray-200 dark:border-white/10',
                      'focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0',
                      'text-gray-900 dark:text-white',
                      'placeholder-gray-500 dark:placeholder-gray-500'
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCategoryModal(false);
                  }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-2xl font-bold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSaveCategory();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-blue-500/30"
                >
                  Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
