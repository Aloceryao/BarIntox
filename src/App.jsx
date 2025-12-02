import React, { useState, useEffect, useMemo } from 'react';
import { 
  Beer, 
  GlassWater, 
  Calculator, 
  Settings, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  History, 
  AlertTriangle,
  Download,
  Upload,
  RefreshCcw,
  X,
  ChevronLeft,
  Wine,
  Camera,
  AlertCircle,
  Tag,
  Check,
  DollarSign,
  Filter,
  Layers,
  Quote,
  FilePlus,
  FileWarning
} from 'lucide-react';

// --- Constants & Data ---

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('zh-TW', { hour12: false, month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' });
};

const TARGET_COST_RATE = 0.25;

const DEFAULT_TECHNIQUES = ['直調', '搖盪', '攪拌', '滾動', '攪打', '分層'];
const DEFAULT_TAGS = ['酸', '甜', '苦', '辣', '氣泡', '清爽', '重酒感', '果香', '花香', '煙燻', '草本', '木質', '奶油', '咖啡', '茶香'];
const DEFAULT_GLASSES = ['Highball (高球杯)', 'Rock (古典杯)', 'Martini (馬丁尼杯)', 'Coupe (寬口香檳杯)', 'Collins (柯林斯杯)', 'Shot (一口杯)', 'Flute (香檳杯)', 'Tiki (提基杯)', 'Mug (馬克杯)'];
const BASE_SPIRITS = ['琴酒 (Gin)', '伏特加 (Vodka)', '蘭姆酒 (Rum)', '龍舌蘭 (Tequila)', '威士忌 (Whiskey)', '白蘭地 (Brandy)', '利口酒 (Liqueur)', '其他 (Other)'];
const UNITS = ['ml', 'oz', 'g', 'kg', '顆', '片', 'dash', 'tsp', 'drop', '瓶'];

const DEFAULT_ING_CATEGORIES = [
  { id: 'alcohol', label: '酒類' },
  { id: 'soft', label: '軟飲' },
  { id: 'other', label: '其他' }
];

// --- Helper Functions ---

const calculateRecipeStats = (recipe, ingredients) => {
  let totalCost = 0;
  let totalVol = 0;
  let totalAlcoholVol = 0;

  if (recipe.ingredients) {
    recipe.ingredients.forEach(item => {
      const ing = ingredients.find(i => i.id === item.id);
      if (ing) {
        const costPerUnit = ing.price / (ing.volume || 1);
        totalCost += costPerUnit * item.amount;
        if (ing.type !== 'other' && (ing.unit === 'ml' || !ing.unit)) {
          totalVol += parseFloat(item.amount);
          totalAlcoholVol += parseFloat(item.amount) * (ing.abv / 100);
        }
      }
    });
  }

  const techLower = recipe.technique ? recipe.technique.toLowerCase() : '';
  const dilution = techLower.includes('stir') || techLower.includes('攪拌') ? 20 : 
                   techLower.includes('shake') || techLower.includes('搖盪') ? 30 : 0; 
  
  const finalVol = totalVol + dilution;
  const finalAbv = finalVol > 0 ? (totalAlcoholVol / finalVol) * 100 : 0;
  const suggestedPrice = totalCost > 0 ? Math.ceil(totalCost / TARGET_COST_RATE / 10) * 10 : 0;
  const price = recipe.customPrice || suggestedPrice;
  const costRate = price > 0 ? (totalCost / price) * 100 : 0;
  const margin = price - totalCost;

  return { totalCost, finalAbv, suggestedPrice, costRate, margin, finalVol, price };
};

// Helper to normalize strings for comparison (remove spaces, lowercase)
const normalizeStr = (str) => str ? str.toLowerCase().replace(/\s+/g, '') : '';

// --- UI Components ---

const Badge = ({ children, color = "slate", className="" }) => {
  const colors = {
    slate: "bg-slate-700 text-slate-300",
    gold: "bg-amber-900/30 text-amber-400 border border-amber-500/30",
    rose: "bg-rose-900/30 text-rose-400 border border-rose-500/30",
    blue: "bg-blue-900/30 text-blue-400 border border-blue-500/30",
    emerald: "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30",
    purple: "bg-purple-900/30 text-purple-400 border border-purple-500/30",
  };
  return (
    <span className={`px-2 py-1 rounded text-[10px] tracking-wider font-medium select-none ${colors[color] || colors.slate} ${className}`}>
      {children}
    </span>
  );
};

const ChipSelector = ({ options, selected, onSelect, onAdd, single = false, title }) => {
  const [newTag, setNewTag] = useState('');
  
  const handleAdd = () => {
    if (newTag.trim()) {
      onAdd(newTag.trim());
      setNewTag('');
    }
  };

  const isSelected = (opt) => {
    if (single) return selected === opt;
    return selected?.includes(opt);
  };

  const handleSelect = (opt) => {
    if (single) {
      onSelect(selected === opt ? '' : opt);
    } else {
      const current = selected || [];
      if (current.includes(opt)) {
        onSelect(current.filter(s => s !== opt));
      } else {
        onSelect([...current, opt]);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs text-slate-500 font-bold uppercase select-none">{title}</label>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border select-none ${
              isSelected(opt)
                ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-900/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {opt.split(' (')[0]}
            {isSelected(opt) && <Check size={12} className="inline ml-1" />}
          </button>
        ))}
        {onAdd && (
          <div className="flex items-center bg-slate-800 rounded-full border border-slate-700 px-2">
            <input 
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="自訂..."
              className="bg-transparent w-16 text-xs py-1.5 outline-none text-slate-300 placeholder-slate-600"
            />
            <button onClick={handleAdd} className="text-slate-500 hover:text-amber-500"><Plus size={14}/></button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-Screens ---

const SingleItemScreen = ({ ingredients, searchTerm }) => {
  const singles = ingredients.filter(i => 
    i.type === 'alcohol' && 
    (i.isSingle !== false) && 
    (i.nameZh.includes(searchTerm) || i.nameEn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="grid gap-3 w-full">
      {singles.map(ing => {
        const costPerUnit = ing.price / (ing.volume || 1);
        const sizes = [
          { label: 'Shot (30ml)', amount: 30 },
          { label: 'Glass (50ml)', amount: 50 },
        ];
        
        return (
          <div key={ing.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 w-full">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-slate-100 font-bold">{ing.nameZh}</div>
                <div className="text-slate-500 text-xs">{ing.nameEn}</div>
              </div>
              <div className="text-slate-400 text-xs text-right">
                進貨 ${ing.price}<br/>{ing.volume}{ing.unit || 'ml'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sizes.map(size => {
                const cost = costPerUnit * size.amount;
                const suggest = Math.ceil(cost / TARGET_COST_RATE / 10) * 10;
                return (
                  <div key={size.label} className="bg-slate-900/50 p-2 rounded border border-slate-700/50 flex justify-between items-center">
                     <div className="text-xs text-slate-400">{size.label}</div>
                     <div className="text-right">
                       <div className="text-amber-500 font-bold text-sm">${suggest}</div>
                       <div className="text-[10px] text-slate-600">成本 ${cost.toFixed(0)}</div>
                     </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {singles.length === 0 && (
        <div className="text-center py-10 text-slate-500 flex flex-col items-center">
          <Wine size={48} className="mb-4 opacity-20"/>
          <p>沒有符合的單品</p>
          <p className="text-xs mt-2 opacity-50">請至「材料庫」將酒水勾選「列入單品」</p>
        </div>
      )}
    </div>
  );
};

const RecipeListScreen = ({ 
  recipes, 
  ingredients, 
  searchTerm, 
  setSearchTerm, 
  recipeCategoryFilter, 
  setRecipeCategoryFilter, 
  startEdit, 
  setViewingItem,
  availableTags,
  availableBases = BASE_SPIRITS
}) => {
  const [filterBases, setFilterBases] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return recipes.filter(r => {
      const matchCat = recipeCategoryFilter === 'all' || r.type === recipeCategoryFilter;
      const matchSearch = r.nameZh.includes(searchTerm) || r.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBase = filterBases.length === 0 || filterBases.includes(r.baseSpirit);
      const matchTags = filterTags.length === 0 || filterTags.every(t => r.tags?.includes(t));
      return matchCat && matchSearch && matchBase && matchTags;
    });
  }, [recipes, recipeCategoryFilter, searchTerm, filterBases, filterTags]);

  return (
    <div className="pb-24 animate-fade-in w-full">
      <div className="sticky top-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 shadow-md pt-safe">
        <div className="px-4 py-3 flex gap-2 w-full">
           <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4"/>
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜尋酒單..."
                className="w-full bg-slate-900 text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500/50 text-sm"
              />
           </div>
           {recipeCategoryFilter !== 'single' && (
             <button 
               onClick={() => setShowFilters(!showFilters)} 
               className={`p-2 rounded-xl border transition-colors ${showFilters || filterBases.length > 0 || filterTags.length > 0 ? 'bg-slate-800 border-amber-500/50 text-amber-500' : 'border-slate-800 text-slate-400'}`}
             >
               <Filter size={20} />
             </button>
           )}
           {recipeCategoryFilter !== 'single' && (
             <button onClick={() => startEdit('recipe')} className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-xl shadow-lg active:scale-95 transition-all">
               <Plus size={20} />
             </button>
           )}
        </div>

        <div className="flex px-4 border-b border-slate-800/50 w-full overflow-x-auto no-scrollbar">
           {[
             {id: 'all', label: '全部 All'},
             {id: 'classic', label: '經典 Classic'},
             {id: 'signature', label: '特調 Signature'},
             {id: 'single', label: '單品/純飲 Single'}
           ].map(cat => (
             <button 
               key={cat.id}
               onClick={() => setRecipeCategoryFilter(cat.id)}
               className={`flex-1 pb-3 px-4 text-sm font-medium border-b-2 transition-colors select-none whitespace-nowrap ${recipeCategoryFilter === cat.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}
             >
               {cat.label}
             </button>
           ))}
        </div>

        {showFilters && recipeCategoryFilter !== 'single' && (
          <div className="p-4 bg-slate-900 border-b border-slate-800 animate-slide-up w-full">
            <div className="mb-4">
              <ChipSelector 
                title="基酒篩選 (Base)" 
                options={availableBases} 
                selected={filterBases} 
                onSelect={setFilterBases} 
              />
            </div>
            <div>
              <ChipSelector 
                title="風味篩選 (Flavor)" 
                options={availableTags} 
                selected={filterTags} 
                onSelect={setFilterTags} 
              />
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
               <span>找到 {filtered.length} 款酒譜</span>
               <button onClick={() => {setFilterBases([]); setFilterTags([]);}} className="text-rose-400 hover:text-rose-300">清除篩選</button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 w-full">
         {recipeCategoryFilter === 'single' ? (
           <SingleItemScreen ingredients={ingredients} searchTerm={searchTerm} />
         ) : (
           filtered.length > 0 ? (
             filtered.map(recipe => {
               const stats = calculateRecipeStats(recipe, ingredients);
               return (
                 <div key={recipe.id} onClick={() => setViewingItem(recipe)} className="group bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-800 hover:border-slate-700 transition-all active:scale-[0.98] flex flex-row h-36 w-full">
                   <div className="w-32 h-full relative shrink-0 bg-slate-900">
                      {recipe.image ? (
                        <img src={recipe.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={recipe.nameZh} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <Wine size={32} opacity={0.3} />
                        </div>
                      )}
                   </div>
                   
                   <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-white leading-tight font-serif tracking-wide truncate pr-2">{recipe.nameZh}</h3>
                          <div className="text-amber-400 font-bold text-lg font-mono">${stats.price}</div>
                        </div>
                        <p className="text-slate-400 text-xs font-medium tracking-wider uppercase truncate opacity-80 mb-1">{recipe.nameEn}</p>
                        
                        {/* Flavor Description Preview */}
                        {recipe.flavorDescription && (
                          <div className="text-[10px] text-slate-500 line-clamp-1 italic mb-1.5 opacity-80">
                            "{recipe.flavorDescription}"
                          </div>
                        )}

                        <div className="flex gap-1 flex-wrap">
                          {recipe.baseSpirit && <Badge color="blue" className="scale-90 origin-left">{recipe.baseSpirit.split(' ')[0]}</Badge>}
                          {recipe.tags?.slice(0,2).map(tag => (
                            <span key={tag} className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">{tag.split(' ')[0]}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-slate-500 pt-1 border-t border-slate-700/50 mt-1">
                        <span className={stats.costRate > 30 ? 'text-rose-400' : 'text-emerald-400'}>CR {stats.costRate.toFixed(0)}%</span>
                        <span>|</span>
                        <span>{stats.finalAbv.toFixed(1)}% ABV</span>
                      </div>
                   </div>
                 </div>
               );
             })
           ) : (
             <div className="text-center py-10 text-slate-500 flex flex-col items-center">
               <Filter size={48} className="mb-4 opacity-20"/>
               <p>沒有找到符合條件的酒譜</p>
             </div>
           )
         )}
         <div className="h-10"></div>
      </div>
    </div>
  );
};

const InventoryScreen = ({ ingredients, startEdit, requestDelete, ingCategories, setIngCategories }) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      const newId = generateId(); // Ensure unique ID
      setIngCategories([...ingCategories, { id: newId, label: newCatName.trim() }]);
      setNewCatName('');
      setIsAddingCat(false);
      setCategoryFilter(newId);
    }
  };

  const deleteCategory = (id) => {
    if (['alcohol', 'soft', 'other'].includes(id)) return; // Prevent deleting defaults
    if (confirm('確定刪除此分類？(分類下的材料不會被刪除，但會從此分類移除)')) {
      setIngCategories(ingCategories.filter(c => c.id !== id));
      if (categoryFilter === id) setCategoryFilter('all');
    }
  };

  const filteredIngredients = ingredients.filter(i => {
    if (categoryFilter === 'all') return true;
    return i.type === categoryFilter;
  });

  return (
    <div className="pb-24 animate-fade-in w-full">
      <div className="sticky top-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 shadow-md px-4 pt-safe pb-0">
        <div className="flex justify-between items-center mb-4 mt-4">
          <h2 className="text-2xl font-serif text-slate-100">材料庫</h2>
          <button onClick={() => startEdit('ingredient')} className="flex items-center gap-2 bg-slate-800 text-slate-200 px-4 py-2 rounded-full border border-slate-700 text-sm hover:bg-slate-700">
            <Plus size={16} /> 新增
          </button>
        </div>
        
        {/* Dynamic Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all select-none ${
              categoryFilter === 'all' 
                ? 'bg-amber-600 text-white shadow' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            全部
          </button>
          
          {ingCategories.map(cat => (
            <div key={cat.id} className="relative group">
              <button
                onClick={() => setCategoryFilter(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all pr-4 select-none ${
                  categoryFilter === cat.id 
                    ? 'bg-slate-700 text-white border border-amber-500/50 shadow' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
              {/* Delete Custom Category Button */}
              {!['alcohol', 'soft', 'other'].includes(cat.id) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px]"
                >
                  <X size={8} strokeWidth={4}/>
                </button>
              )}
            </div>
          ))}

          {/* Add Category Button/Input */}
          {isAddingCat ? (
            <div className="flex items-center bg-slate-800 rounded-full px-2 py-1 border border-slate-600 animate-fade-in">
              <input 
                autoFocus
                className="bg-transparent text-xs text-white w-16 outline-none"
                placeholder="分類名稱"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                onBlur={() => { if(!newCatName) setIsAddingCat(false); }}
              />
              <button onClick={handleAddCategory} className="text-amber-500 ml-1"><Check size={14}/></button>
            </div>
          ) : (
            <button onClick={() => setIsAddingCat(true)} className="p-1.5 bg-slate-800 rounded-full text-slate-500 hover:text-white hover:bg-slate-700">
              <Plus size={14}/>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2 w-full">
        {filteredIngredients.map(ing => (
          <div key={ing.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors group w-full">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer" 
              onClick={() => startEdit('ingredient', ing)}
            >
               <div className={`w-2 h-10 rounded-full ${['alcohol'].includes(ing.type) ? 'bg-purple-500/50' : ['soft'].includes(ing.type) ? 'bg-blue-500/50' : 'bg-slate-500/50'}`}></div>
               <div>
                 <div className="text-slate-200 font-medium">{ing.nameZh}</div>
                 <div className="text-slate-500 text-xs">{ing.nameEn}</div>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="text-right cursor-pointer" onClick={() => startEdit('ingredient', ing)}>
                  <div className="text-slate-300 text-sm font-mono">${ing.price}</div>
                  <div className="text-slate-600 text-[10px]">{ing.volume}{ing.unit || 'ml'}</div>
               </div>
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   requestDelete(ing.id, 'ingredient');
                 }}
                 className="p-3 -mr-2 text-slate-600 hover:text-rose-500 hover:bg-rose-900/20 rounded-full transition-colors active:scale-95"
               >
                 <Trash2 size={20} />
               </button>
            </div>
          </div>
        ))}
        {filteredIngredients.length === 0 && (
          <div className="text-center py-10 text-slate-500 flex flex-col items-center">
            <Layers size={40} className="mb-2 opacity-20"/>
            <span>此分類無材料</span>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickCalcScreen = ({ ingredients }) => {
  const [mode, setMode] = useState('single'); // 'single' or 'draft'
  
  // Single Mode State
  const [p, setP] = useState('');
  const [v, setV] = useState(700); // 預設 700ml
  
  // Cost Rate Settings
  const [rateA, setRateA] = useState(25);
  const [rateB, setRateB] = useState(30);
  
  // Draft Mode State
  const [draftIngs, setDraftIngs] = useState([]);
  const [ingSearch, setIngSearch] = useState('');
  
  // --- Single Calculations ---
  // 使用 parseFloat 確保字串被正確轉換為數字
  const priceNum = parseFloat(p) || 0;
  const volNum = parseFloat(v) || 700;
  const costPerMl = priceNum / volNum;

  // --- Draft Calculations ---
  const draftStats = calculateRecipeStats({ ingredients: draftIngs }, ingredients);

  return (
    <div className="pb-24 animate-fade-in text-slate-200 w-full">
      {/* Mode Switcher */}
      <div className="bg-slate-900 sticky top-0 z-20 border-b border-slate-800 p-4 pt-safe">
        <h2 className="text-xl font-serif mb-4 mt-4">成本計算工具</h2>
        <div className="flex bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setMode('single')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all select-none ${mode === 'single' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}
          >
            純飲速算
          </button>
          <button 
            onClick={() => setMode('draft')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all select-none ${mode === 'draft' ? 'bg-amber-600 text-white shadow' : 'text-slate-500'}`}
          >
            雞尾酒草稿 (Draft)
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 w-full">
        {mode === 'single' ? (
          <>
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">進貨價格 ($)</label>
                   <input type="number" value={p} onChange={e => setP(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-lg text-center focus:border-amber-500 outline-none" placeholder="0"/>
                 </div>
                 <div className="flex-1">
                   <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">容量 (ml)</label>
                   <input type="number" value={v} onChange={e => setV(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-lg text-center focus:border-amber-500 outline-none" placeholder="700"/>
                 </div>
               </div>
               {costPerMl > 0 && (
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                     <span className="text-xs text-slate-500">1ml 成本: </span>
                     <span className="text-emerald-400 font-mono font-bold">${costPerMl.toFixed(2)}</span>
                  </div>
               )}
            </div>

            {/* Target Cost Rate Settings */}
            <div className="flex gap-4 items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
               <div className="text-xs text-slate-400 font-bold uppercase w-20">目標成本率設定:</div>
               <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                     <input 
                       type="number" 
                       value={rateA}
                       onChange={e => setRateA(e.target.value)}
                       className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-center text-amber-400 font-bold focus:border-amber-500 outline-none"
                     />
                     <span className="absolute right-2 top-2 text-slate-500 text-xs">%</span>
                  </div>
                  <div className="relative flex-1">
                     <input 
                       type="number" 
                       value={rateB}
                       onChange={e => setRateB(e.target.value)}
                       className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-center text-blue-400 font-bold focus:border-blue-500 outline-none"
                     />
                     <span className="absolute right-2 top-2 text-slate-500 text-xs">%</span>
                  </div>
               </div>
            </div>
            
            {/* Quick Reference Table - Redesigned */}
            {costPerMl > 0 && (
               <div className="space-y-3">
                 <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-500 uppercase font-bold px-2">
                    <div>規格</div>
                    <div className="text-right">成本</div>
                    <div className="text-right text-amber-500">{rateA}% 售價</div>
                    <div className="text-right text-blue-400">{rateB}% 售價</div>
                 </div>
                 
                 {[
                   { label: 'Shot (30ml)', vol: 30 },
                   { label: 'Glass (50ml)', vol: 50 },
                   { label: 'Double (60ml)', vol: 60 },
                   { label: `整瓶 (${volNum}ml)`, vol: volNum }
                 ].map(row => {
                   const cost = costPerMl * row.vol;
                   // Calculate suggested price: Cost / Rate% rounded to nearest 10
                   const priceA = Math.ceil(cost / (rateA/100) / 10) * 10;
                   const priceB = Math.ceil(cost / (rateB/100) / 10) * 10;
                   
                   return (
                     <div key={row.label} className="grid grid-cols-4 gap-2 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                        <div className="font-mono text-slate-300 text-xs">{row.label}</div>
                        <div className="text-right text-slate-400 text-xs font-mono">${cost.toFixed(0)}</div>
                        <div className="text-right text-amber-400 font-bold font-mono">${priceA}</div>
                        <div className="text-right text-blue-400 font-bold font-mono">${priceB}</div>
                     </div>
                   )
                 })}
               </div>
             )}
          </>
        ) : (
          /* --- DRAFT MODE --- */
          <div className="space-y-4">
             <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-200">臨時配方試算</h3>
                   <button onClick={() => setDraftIngs([])} className="text-xs text-rose-400 select-none">清空</button>
                </div>
                
                {/* Draft List */}
                <div className="space-y-2 mb-4">
                  {draftIngs.map((item, idx) => {
                    const ing = ingredients.find(i => i.id === item.id);
                    return (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                         <div className="text-sm text-slate-300">{ing?.nameZh}</div>
                         <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             className="w-16 bg-slate-800 border border-slate-600 rounded text-center text-sm p-1"
                             value={item.amount}
                             onChange={(e) => {
                               const newDraft = [...draftIngs];
                               newDraft[idx].amount = e.target.value;
                               setDraftIngs(newDraft);
                             }}
                           />
                           <span className="text-xs text-slate-500 w-6">{ing?.unit || 'ml'}</span>
                           <button onClick={() => setDraftIngs(draftIngs.filter((_,i)=>i!==idx))}><X size={14} className="text-slate-500"/></button>
                         </div>
                      </div>
                    )
                  })}
                  {draftIngs.length === 0 && <div className="text-center text-slate-600 text-sm py-4">從下方選擇材料加入</div>}
                </div>

                {/* Draft Stats */}
                {draftIngs.length > 0 && (
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-4">
                     <div>
                       <div className="text-xs text-slate-500">總成本</div>
                       <div className="text-xl font-mono text-emerald-400">${Math.round(draftStats.totalCost)}</div>
                     </div>
                     <div>
                        <div className="text-xs text-slate-500">建議售價 (25%)</div>
                        <div className="text-xl font-mono text-amber-400">${draftStats.suggestedPrice}</div>
                     </div>
                  </div>
                )}
             </div>

             {/* Ingredient Picker for Draft with Search */}
             <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
                <div className="text-xs text-slate-500 uppercase font-bold mb-2">加入材料</div>
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-2 text-slate-500 w-4 h-4" />
                  <input 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 pl-8 text-sm text-slate-300 focus:border-amber-500 outline-none"
                    placeholder="搜尋材料名稱..."
                    value={ingSearch}
                    onChange={e => setIngSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                   {ingredients
                     .filter(ing => 
                        ing.nameZh.includes(ingSearch) || 
                        ing.nameEn.toLowerCase().includes(ingSearch.toLowerCase())
                     )
                     .map(ing => (
                     <button 
                       key={ing.id}
                       onClick={() => setDraftIngs([...draftIngs, { id: ing.id, amount: 30 }])}
                       className="w-full text-left p-2 hover:bg-slate-700 rounded flex justify-between group"
                     >
                       <span className="text-slate-300 text-sm">{ing.nameZh}</span>
                       <Plus size={14} className="text-slate-500 group-hover:text-amber-500"/>
                     </button>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Overlays (Editor & Viewer) ---

const EditorSheet = ({ 
  mode, 
  item, 
  setItem, 
  onSave, 
  onClose, 
  ingredients, 
  availableTechniques, 
  setAvailableTechniques, 
  availableTags, 
  setAvailableTags,
  availableGlasses,
  setAvailableGlasses,
  requestDelete,
  ingCategories,
  setIngCategories
}) => {
  if (!mode || !item) return null;
  const isRecipe = mode === 'recipe';
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [ingSearch, setIngSearch] = useState('');

  const handleAddCategory = () => {
    if(newCatName.trim()){
      const newId = generateId();
      setIngCategories([...ingCategories, { id: newId, label: newCatName.trim() }]);
      setItem({...item, type: newId}); 
      setNewCatName('');
      setShowAddCat(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setItem({...item, image: canvas.toDataURL('image/jpeg', 0.7)});
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col animate-slide-up w-full h-full">
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center safe-top pt-safe-offset">
         <button onClick={onClose} className="text-slate-400 hover:text-white p-2 select-none">取消</button>
         <h3 className="text-slate-100 font-bold">{item.id && item.nameZh ? '編輯項目' : '新增項目'}</h3>
         <button onClick={onSave} className="text-amber-500 font-bold hover:text-amber-400 p-2 select-none">儲存</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isRecipe && (
          <div className="relative h-48 bg-slate-900 rounded-xl border-2 border-dashed border-slate-800 overflow-hidden flex flex-col items-center justify-center text-slate-600 group hover:border-slate-600 transition-colors">
            {item.image ? (
              <>
                <img src={item.image} className="w-full h-full object-cover opacity-60" />
                <button onClick={() => setItem({...item, image: ''})} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white"><X size={16}/></button>
              </>
            ) : (
              <div className="flex flex-col items-center pointer-events-none">
                <Camera size={32} className="mb-2"/>
                <span className="text-xs">點擊上傳照片</span>
              </div>
            )}
            {!item.image && (
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            )}
          </div>
        )}

        <div className="space-y-4">
           <div>
             <label className="text-xs text-slate-500 font-bold uppercase ml-1">中文名稱</label>
             <input value={item.nameZh} onChange={e => setItem({...item, nameZh: e.target.value})} className="w-full bg-transparent border-b border-slate-700 py-2 text-xl text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none" placeholder="例如: 內格羅尼" />
           </div>
           <div>
             <label className="text-xs text-slate-500 font-bold uppercase ml-1">英文名稱</label>
             <input value={item.nameEn} onChange={e => setItem({...item, nameEn: e.target.value})} className="w-full bg-transparent border-b border-slate-700 py-2 text-lg text-slate-400 placeholder-slate-700 focus:border-slate-500 focus:outline-none font-serif italic" placeholder="e.g. Negroni" />
           </div>
        </div>

        {!isRecipe ? (
          <div className="bg-slate-900 p-4 rounded-xl space-y-4 border border-slate-800">
             <div className="flex gap-4">
               <div className="flex-1">
                 <label className="text-xs text-slate-500 mb-1 block">價格</label>
                 <input type="number" value={item.price} onChange={e => setItem({...item, price: e.target.value})} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-700"/>
               </div>
               <div className="flex-1">
                 <label className="text-xs text-slate-500 mb-1 block">容量/數量</label>
                 <input type="number" value={item.volume} onChange={e => setItem({...item, volume: e.target.value})} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-700"/>
               </div>
             </div>
             <div className="flex gap-4">
                <div className="flex-1">
                   <label className="text-xs text-slate-500 mb-1 block">單位 (Unit)</label>
                   <select value={item.unit || 'ml'} onChange={e => setItem({...item, unit: e.target.value})} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-700">
                     {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                   </select>
                </div>
                <div className="flex-1">
                   <label className="text-xs text-slate-500 mb-1 block">酒精 %</label>
                   <input type="number" value={item.abv} onChange={e => setItem({...item, abv: e.target.value})} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-700"/>
                </div>
             </div>
             <div className="mt-2">
                 <label className="text-xs text-slate-500 mb-1 block">分類</label>
                 <div className="flex gap-2">
                   <select value={item.type} onChange={e => setItem({...item, type: e.target.value})} className="flex-1 bg-slate-800 rounded p-2 text-white border border-slate-700">
                     {ingCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                   </select>
                   {showAddCat ? (
                     <div className="flex items-center bg-slate-800 border border-slate-600 rounded">
                        <input className="w-20 bg-transparent p-1 text-xs outline-none" placeholder="新分類" value={newCatName} onChange={e => setNewCatName(e.target.value)}/>
                        <button onClick={handleAddCategory} className="p-1 text-amber-500"><Check size={16}/></button>
                     </div>
                   ) : (
                     <button onClick={() => setShowAddCat(true)} className="p-2 bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-white"><Plus size={20}/></button>
                   )}
                 </div>
             </div>
             {item.type === 'alcohol' && (
               <div className="mt-4 pt-4 border-t border-slate-800">
                 <label className="flex items-center gap-3 cursor-pointer group">
                   <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.isSingle !== false ? 'bg-amber-600 border-amber-600' : 'bg-transparent border-slate-600'}`}>
                     {item.isSingle !== false && <Check size={14} className="text-white" />}
                   </div>
                   <input 
                     type="checkbox" 
                     className="hidden"
                     checked={item.isSingle !== false}
                     onChange={e => setItem({...item, isSingle: e.target.checked})}
                   />
                   <span className="text-sm text-slate-300 group-hover:text-white">列入單品菜單 (Available as Single)</span>
                 </label>
                 <p className="text-[10px] text-slate-500 mt-1 ml-8">取消勾選後，此材料將不會出現在「純飲/單品」頁面中。</p>
               </div>
             )}
             {item.id && (
               <button onClick={() => requestDelete(item.id, 'ingredient')} className="w-full py-3 text-rose-500 text-sm border border-rose-900/50 rounded mt-4">刪除此材料</button>
             )}
          </div>
        ) : (
          <>
            <div className="space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-bold uppercase block mb-2">酒譜分類 (Category)</label>
                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => setItem({...item, type: 'classic'})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors border ${item.type === 'classic' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'}`}
                  >
                    經典 Classic
                  </button>
                  <button 
                    onClick={() => setItem({...item, type: 'signature'})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors border ${item.type === 'signature' ? 'bg-amber-900/50 border-amber-500 text-amber-500' : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'}`}
                  >
                    特調 Signature
                  </button>
                </div>
              </div>

              <div className="mb-4">
                 <label className="text-xs text-slate-500 font-bold uppercase block mb-2">基酒 (Base Spirit)</label>
                 <select value={item.baseSpirit || ''} onChange={e => setItem({...item, baseSpirit: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white outline-none">
                   <option value="">選擇基酒...</option>
                   {BASE_SPIRITS.map(base => <option key={base} value={base}>{base}</option>)}
                 </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold uppercase ml-1">風味描述</label>
                <textarea value={item.flavorDescription || ''} onChange={e => setItem({...item, flavorDescription: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-300 h-24 focus:border-amber-500 outline-none mt-2" placeholder="例如: 前味帶有柑橘香氣，尾韻回甘..." />
              </div>
              <ChipSelector title="調製手法" options={availableTechniques} selected={item.technique} single={true} onSelect={(val) => setItem({...item, technique: val})} onAdd={(val) => setAvailableTechniques([...availableTechniques, val])} />
              <ChipSelector title="杯具 (Glassware)" options={availableGlasses} selected={item.glass} single={true} onSelect={(val) => setItem({...item, glass: val})} onAdd={(val) => setAvailableGlasses([...availableGlasses, val])} />
              <ChipSelector title="風味標籤" options={availableTags} selected={item.tags || []} single={false} onSelect={(val) => setItem({...item, tags: val})} onAdd={(val) => setAvailableTags([...availableTags, val])} />
            </div>

            <div>
              <div className="flex justify-between items-end mb-2 border-b border-slate-800 pb-2">
                <label className="text-sm text-slate-400 font-bold uppercase">配方成分</label>
                <div className="text-right">
                  <div className="text-xs text-slate-500">預估成本</div>
                  <div className="text-emerald-400 font-mono">${Math.round(calculateRecipeStats(item, ingredients).totalCost)}</div>
                </div>
              </div>
              
              <div className="space-y-3 mb-3">
                {item.ingredients.map((ingItem, idx) => {
                  const refIng = ingredients.find(i => i.id === ingItem.id);
                  if(!refIng) return null;
                  return (
                    <div key={idx} className="flex items-center gap-3 bg-slate-800/50 p-2 rounded border border-slate-800">
                       <div className="flex-1 text-slate-300 text-sm">{refIng.nameZh}</div>
                       <input type="number" className="w-16 bg-slate-900 border border-slate-700 rounded text-center text-amber-400 p-1" value={ingItem.amount} onChange={e => { const newIngs = [...item.ingredients]; newIngs[idx].amount = e.target.value; setItem({...item, ingredients: newIngs}); }} />
                       <span className="text-xs text-slate-600 w-6">{refIng.unit || 'ml'}</span>
                       <button onClick={() => { const newIngs = item.ingredients.filter((_, i) => i !== idx); setItem({...item, ingredients: newIngs}); }} className="text-slate-600 hover:text-rose-500"><X size={16}/></button>
                    </div>
                  )
                })}
              </div>
              
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-2 mt-2">
                 <div className="text-xs text-slate-500 mb-2 font-bold uppercase">加入材料</div>
                 <div className="relative mb-2">
                   <Search className="absolute left-2 top-2 text-slate-500 w-4 h-4" />
                   <input className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 pl-8 text-sm text-slate-300 focus:border-amber-500 outline-none" placeholder="搜尋材料名稱..." value={ingSearch} onChange={e => setIngSearch(e.target.value)} />
                 </div>
                 <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                   {ingredients.filter(ing => ing.nameZh.includes(ingSearch) || ing.nameEn.toLowerCase().includes(ingSearch.toLowerCase())).map(ing => (
                     <button key={ing.id} onClick={() => setItem({...item, ingredients: [...item.ingredients, { id: ing.id, amount: 30 }]})} className="w-full text-left p-2 hover:bg-slate-700 rounded flex justify-between group">
                       <span className="text-slate-300 text-sm">{ing.nameZh}</span>
                       <Plus size={14} className="text-slate-500 group-hover:text-amber-500" />
                     </button>
                   ))}
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs text-slate-500 block mb-1">自訂售價</label>
                 <input type="number" placeholder={`建議 $${calculateRecipeStats(item, ingredients).suggestedPrice}`} value={item.customPrice} onChange={e => setItem({...item, customPrice: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
               </div>
            </div>
            
            <div>
              <label className="text-xs text-slate-500 block mb-1">製作步驟 / 備註</label>
              <textarea value={item.method} onChange={e => setItem({...item, method: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-slate-300 h-32 placeholder-slate-600" placeholder="1. 冰鎮酒杯..." />
            </div>
          </>
        )}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

// --- Viewer Overlay ---
const ViewerOverlay = ({ item, onClose, ingredients, startEdit, requestDelete }) => {
  if (!item) return null;
  const stats = calculateRecipeStats(item, ingredients);

  return (
    <div className="fixed inset-0 z-30 bg-slate-950 flex flex-col animate-scale-in overflow-y-auto w-full h-full">
       <div className="relative h-64 sm:h-80 w-full shrink-0">
         {item.image ? (
           <img src={item.image} className="w-full h-full object-cover" />
         ) : (
           <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Wine size={64} className="text-slate-700"/></div>
         )}
         <button onClick={onClose} className="fixed top-4 left-4 z-50 bg-black/30 backdrop-blur p-2 rounded-full text-white hover:bg-black/50 transition mt-safe" style={{ marginTop: 'env(safe-area-inset-top)' }}>
           <ChevronLeft size={24} />
         </button>
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30"></div>
         <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-4xl font-serif text-white font-bold mb-1 shadow-black drop-shadow-lg">{item.nameZh}</h1>
            <div className="flex items-center gap-2">
               <p className="text-slate-300 text-lg italic font-serif opacity-90">{item.nameEn}</p>
               {item.baseSpirit && <Badge color="blue" className="shadow-lg">{item.baseSpirit.split(' ')[0]}</Badge>}
               {item.technique && <Badge color="purple" className="shadow-lg">{item.technique}</Badge>}
            </div>
         </div>
       </div>

       <div className="flex-1 p-6 space-y-8">
          <div className="flex justify-between items-center py-4 border-b border-slate-800">
             <div className="text-center">
               <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">售價 (Price)</div>
               <div className="text-2xl text-amber-400 font-mono font-bold">${stats.price}</div>
             </div>
             <div className="h-8 w-px bg-slate-800"></div>
             <div className="text-center">
               <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">酒精 (ABV)</div>
               <div className="text-xl text-slate-300 font-mono">{stats.finalAbv.toFixed(1)}%</div>
             </div>
             <div className="h-8 w-px bg-slate-800"></div>
             <div className="text-center">
               <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">成本率 (Cost)</div>
               <div className={`text-xl font-mono ${stats.costRate > 30 ? 'text-rose-500' : 'text-emerald-500'}`}>{stats.costRate.toFixed(1)}%</div>
             </div>
          </div>

          {item.flavorDescription && (
            <div className="relative bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <Quote className="absolute top-4 left-4 text-slate-700 w-6 h-6" />
              <div className="italic text-slate-300 text-sm leading-relaxed pl-6">
                {item.flavorDescription}
              </div>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
               {item.tags.map(tag => (
                 <span key={tag} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300 flex items-center gap-1">
                   <Tag size={12} className="text-amber-500"/> {tag}
                 </span>
               ))}
            </div>
          )}

          <div>
            <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <GlassWater size={14}/> 配方 (Recipe)
            </h3>
            <ul className="space-y-3">
              {item.ingredients.map((ingItem, idx) => {
                const ing = ingredients.find(i => i.id === ingItem.id);
                return ing ? (
                  <li key={idx} className="flex justify-between items-center text-slate-300 border-b border-slate-800/50 pb-2">
                    <span>{ing.nameZh}</span>
                    <span className="font-mono text-slate-500">{ingItem.amount}{ing.unit || 'ml'}</span>
                  </li>
                ) : null;
              })}
            </ul>
            <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-800 flex justify-between text-xs text-slate-500 font-mono">
               <span>總成本: ${stats.totalCost.toFixed(1)}</span>
               <span>毛利: ${stats.margin.toFixed(0)}</span>
            </div>
          </div>

          <div>
             <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
               <Settings size={14}/> 製作說明 (Method)
             </h3>
             <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-serif">
               {item.method || "無製作說明"}
             </div>
             <div className="mt-4 flex gap-2">
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">杯型: {item.glass}</span>
                {item.allergens && (
                  <span className="text-xs bg-rose-900/20 text-rose-500 px-2 py-1 rounded border border-rose-900/50">警示: {item.allergens}</span>
                )}
             </div>
          </div>

          {item.history?.length > 0 && (
             <div className="pt-6 border-t border-slate-800">
                <details>
                  <summary className="text-slate-600 text-xs cursor-pointer hover:text-slate-400 transition">查看修改紀錄</summary>
                  <div className="mt-3 space-y-2">
                    {item.history.map((h, i) => (
                      <div key={i} className="text-[10px] text-slate-500 flex justify-between">
                        <span>{formatDate(h.date)}</span>
                        <span>舊版本</span>
                      </div>
                    ))}
                  </div>
                </details>
             </div>
          )}
          
          <div className="pt-6 border-t border-slate-800 flex gap-3">
              <button onClick={() => startEdit('recipe', item)} className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2">
                  <Edit3 size={18}/> 編輯酒譜
              </button>
              <button onClick={() => requestDelete(item.id, 'recipe')} className="px-4 py-3 text-rose-500 hover:bg-rose-900/20 border border-rose-900/50 rounded-xl">
                  <Trash2 size={20}/>
              </button>
          </div>
          <div className="h-10"></div>
       </div>
    </div>
  );
};

// --- 4. Main App Content ---

function MainAppContent() {
  const [activeTab, setActiveTab] = useState('recipes'); 
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  
  const [availableTechniques, setAvailableTechniques] = useState(DEFAULT_TECHNIQUES);
  const [availableTags, setAvailableTags] = useState(DEFAULT_TAGS);
  const [availableGlasses, setAvailableGlasses] = useState(DEFAULT_GLASSES);
  const [ingCategories, setIngCategories] = useState(DEFAULT_ING_CATEGORIES);

  const [searchTerm, setSearchTerm] = useState('');
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState('classic'); 
  
  const [editorMode, setEditorMode] = useState(null); 
  const [editingItem, setEditingItem] = useState(null); 
  const [viewingItem, setViewingItem] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

  useEffect(() => {
    const savedIngredients = localStorage.getItem('bar_ingredients_v3');
    const savedRecipes = localStorage.getItem('bar_recipes_v3');
    const savedPrefs = localStorage.getItem('bar_preferences_v3');

    if (savedIngredients) setIngredients(JSON.parse(savedIngredients));
    if (savedRecipes) setRecipes(JSON.parse(savedRecipes));
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      if (prefs.techniques) setAvailableTechniques(prefs.techniques);
      if (prefs.tags) setAvailableTags(prefs.tags);
      if (prefs.glasses) setAvailableGlasses(prefs.glasses);
      if (prefs.ingCategories) setIngCategories(prefs.ingCategories);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bar_ingredients_v3', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('bar_recipes_v3', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('bar_preferences_v3', JSON.stringify({
      techniques: availableTechniques,
      tags: availableTags,
      glasses: availableGlasses,
      ingCategories: ingCategories
    }));
  }, [availableTechniques, availableTags, availableGlasses, ingCategories]);

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });
  const showConfirm = (title, message, onConfirm) => setDialog({ isOpen: true, type: 'confirm', title, message, onConfirm });
  const showAlert = (title, message) => setDialog({ isOpen: true, type: 'alert', title, message, onConfirm: null });

  const requestDelete = (id, type) => {
    if (type === 'recipe') {
      showConfirm('刪除酒譜', '確定要刪除這個酒譜嗎？此操作無法復原。', () => {
        setRecipes(prev => prev.filter(r => r.id !== id));
        setViewingItem(null);
        closeDialog();
      });
    } else {
      const targetIng = ingredients.find(i => i.id === id);
      const usedIn = recipes.filter(r => r.ingredients.some(i => i.id === id));
      if (usedIn.length > 0) {
        const names = usedIn.map(r => r.nameZh).join('、');
        showAlert('無法刪除此材料', `此材料 (${targetIng?.nameZh}) 正被以下酒譜使用中：\n\n${names}\n\n請先修改這些酒譜並移除此材料，才能進行刪除。`);
        return;
      }
      showConfirm('刪除庫存材料', `確定要刪除「${targetIng?.nameZh}」嗎？`, () => {
        setIngredients(prev => prev.filter(i => i.id !== id));
        setEditorMode(null);
        closeDialog();
      });
    }
  };

  const handleImport = (e, mode) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (mode === 'overwrite') {
          setIngredients(data.ingredients || []);
          setRecipes(data.recipes || []);
          showAlert('還原成功', '資料已完全覆蓋');
        } else {
          // Smart Merge with Name Matching
          setIngredients(prev => {
            const newItems = (data.ingredients || []).filter(newI => {
              // 1. Check ID conflict
              const idExists = prev.some(oldI => oldI.id === newI.id);
              // 2. Check Name conflict (Smart Match)
              const nameExists = prev.some(oldI => normalizeStr(oldI.nameZh) === normalizeStr(newI.nameZh) || (oldI.nameEn && normalizeStr(oldI.nameEn) === normalizeStr(newI.nameEn)));
              return !idExists && !nameExists;
            });
            return [...prev, ...newItems];
          });
          setRecipes(prev => {
            const newItems = (data.recipes || []).filter(newI => {
              const idExists = prev.some(oldI => oldI.id === newI.id);
              const nameExists = prev.some(oldI => normalizeStr(oldI.nameZh) === normalizeStr(newI.nameZh));
              return !idExists && !nameExists;
            });
            return [...prev, ...newItems];
          });
          showAlert('合併成功', '新資料已加入，重複項目已自動跳過');
        }
      } catch (err) {
        showAlert('錯誤', '檔案格式不正確');
      }
    };
    reader.readAsText(file);
  };

  const startEdit = (type, item = null) => {
    setEditorMode(type);
    if (item) {
      setEditingItem(JSON.parse(JSON.stringify(item)));
    } else {
      if (type === 'ingredient') {
        setEditingItem({ id: generateId(), nameZh: '', nameEn: '', type: 'alcohol', price: '', volume: 700, abv: 0, unit: 'ml' });
      } else {
        setEditingItem({ id: generateId(), nameZh: '', nameEn: '', type: 'classic', technique: '', tags: [], method: '', glass: '', customPrice: '', allergens: '', ingredients: [], history: [], image: '', baseSpirit: '', flavorDescription: '' });
      }
    }
    setViewingItem(null);
  };

  const saveItem = () => {
    if (!editingItem.nameZh) return showAlert('錯誤', '請輸入名稱');
    if (editorMode === 'ingredient') {
      const newItem = { ...editingItem, price: parseFloat(editingItem.price) || 0, volume: parseFloat(editingItem.volume) || 0 };
      setIngredients(prev => {
        const exists = prev.find(i => i.id === newItem.id);
        if (exists) return prev.map(i => i.id === newItem.id ? newItem : i);
        return [...prev, newItem];
      });
    } else {
      const newItem = { ...editingItem, customPrice: parseFloat(editingItem.customPrice) || 0 };
      setRecipes(prev => {
        const exists = prev.find(r => r.id === newItem.id);
        if (exists) {
          const oldVersion = JSON.parse(JSON.stringify(exists));
          delete oldVersion.history;
          newItem.history = [{ date: new Date().toISOString(), snapshot: oldVersion }, ...(exists.history || [])];
          return prev.map(r => r.id === newItem.id ? newItem : r);
        }
        return [...prev, newItem];
      });
    }
    setEditorMode(null);
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 w-full overflow-x-hidden">
      {/* Global Style Overrides to fix Vite Template defaults */}
      <style>{`
        :root {
          font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          font-weight: 400;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background-color: #020617; /* slate-950 */
          display: block !important; /* Override flex from template */
          place-items: unset !important; /* Override center from template */
          min-width: 0 !important;
        }
        #root {
          max-width: none !important; /* KILL THE RESTRICTION */
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          text-align: left !important;
          display: block !important;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .safe-top { padding-top: env(safe-area-inset-top); }
        .pt-safe { padding-top: env(safe-area-inset-top); }
        .mt-safe { margin-top: env(safe-area-inset-top); }
        .pt-safe-offset { padding-top: calc(12px + env(safe-area-inset-top)); }
        /* Tap Highlight Removal */
        * { -webkit-tap-highlight-color: transparent; }
        *:focus { outline: none !important; }
      `}</style>
      
      {activeTab === 'recipes' && <RecipeListScreen recipes={recipes} ingredients={ingredients} searchTerm={searchTerm} setSearchTerm={setSearchTerm} recipeCategoryFilter={recipeCategoryFilter} setRecipeCategoryFilter={setRecipeCategoryFilter} startEdit={startEdit} setViewingItem={setViewingItem} availableTags={availableTags} availableBases={BASE_SPIRITS} />}
      {activeTab === 'ingredients' && <InventoryScreen ingredients={ingredients} startEdit={startEdit} requestDelete={requestDelete} ingCategories={ingCategories} setIngCategories={setIngCategories} />}
      {activeTab === 'quick' && <QuickCalcScreen ingredients={ingredients} />}
      {activeTab === 'tools' && (
         <div className="p-6 text-center space-y-6 pt-20 w-full">
           <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto flex items-center justify-center border border-slate-700 shadow-lg shadow-amber-900/10"><Wine size={32} className="text-amber-500"/></div>
           <h2 className="text-xl font-serif text-slate-200">Bar Manager v6.6</h2>
           <div className="space-y-3">
             <button onClick={() => { const data = JSON.stringify({ingredients, recipes}); const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `bar_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); }} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 hover:bg-slate-700 transition"><Download className="text-blue-400"/><div className="text-left"><div className="text-slate-200 font-bold">匯出數據</div><div className="text-xs text-slate-500">備份到手機</div></div></button>
             
             <label className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 hover:bg-slate-700 transition cursor-pointer">
               <div className="p-2 bg-emerald-900/30 text-emerald-400 rounded-lg"><FilePlus size={24}/></div>
               <div className="text-left flex-1"><div className="text-emerald-400 font-bold">智慧合併 (Merge)</div><div className="text-xs text-slate-500">保留現有資料，加入新資料</div></div>
               <input type="file" className="hidden" accept=".json" onChange={(e) => handleImport(e, 'merge')}/>
             </label>

             <label className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 hover:bg-slate-700 transition cursor-pointer">
               <div className="p-2 bg-amber-900/30 text-amber-400 rounded-lg"><Upload size={24}/></div>
               <div className="text-left flex-1"><div className="text-amber-400 font-bold">覆蓋還原 (Overwrite)</div><div className="text-xs text-slate-500">清空現有資料，完全還原</div></div>
               <input type="file" className="hidden" accept=".json" onChange={(e) => handleImport(e, 'overwrite')}/>
             </label>

             <button onClick={() => { showConfirm('重置系統', '警告：此操作將刪除所有資料且無法還原。確定要繼續嗎？', () => { localStorage.clear(); location.reload(); }); }} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 hover:bg-rose-900/20 transition group"><RefreshCcw className="text-rose-500 group-hover:rotate-180 transition-transform duration-500"/><div className="text-left"><div className="text-rose-500 font-bold">重置系統</div><div className="text-xs text-rose-500/50">刪除所有資料</div></div></button>
           </div>
         </div>
      )}

      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-4">
               {dialog.type === 'alert' ? <div className="w-12 h-12 rounded-full bg-rose-900/30 flex items-center justify-center text-rose-500"><AlertCircle size={32}/></div> : <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center text-amber-500"><AlertTriangle size={32}/></div>}
               <h3 className="text-xl font-bold text-white">{dialog.title}</h3>
               <p className="text-slate-300 text-sm whitespace-pre-wrap">{dialog.message}</p>
               <div className="flex gap-3 w-full pt-2">
                 {dialog.type === 'confirm' && <button onClick={closeDialog} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm">取消</button>}
                 <button onClick={() => { if(dialog.onConfirm) dialog.onConfirm(); if(dialog.type !== 'confirm') closeDialog(); }} className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${dialog.type === 'confirm' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-slate-700 hover:bg-slate-600'}`}>{dialog.type === 'confirm' ? '確認刪除' : '我知道了'}</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur border-t border-slate-800 pb-safe z-30 w-full">
        <div className="w-full flex justify-around items-center h-16 w-full">
          {[{ id: 'recipes', icon: Beer, label: '酒單' }, { id: 'ingredients', icon: GlassWater, label: '材料庫' }, { id: 'quick', icon: Calculator, label: '純飲速算' }, { id: 'tools', icon: Settings, label: '設定' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === tab.id ? 'text-amber-500 -translate-y-1' : 'text-slate-600 hover:text-slate-400'}`}>
              <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <EditorSheet mode={editorMode} item={editingItem} setItem={setEditingItem} onSave={saveItem} onClose={() => setEditorMode(null)} ingredients={ingredients} availableTechniques={availableTechniques} setAvailableTechniques={setAvailableTechniques} availableTags={availableTags} setAvailableTags={setAvailableTags} availableGlasses={availableGlasses} setAvailableGlasses={setAvailableGlasses} requestDelete={requestDelete} ingCategories={ingCategories} setIngCategories={setIngCategories} />
      <ViewerOverlay item={viewingItem} onClose={() => setViewingItem(null)} ingredients={ingredients} startEdit={startEdit} requestDelete={requestDelete} />
    </div>
  );
}

// --- 5. Final Export ---
export default function BarManagerApp() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 w-full overflow-x-hidden">
      <style>{`
        :root { font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif; line-height: 1.5; font-weight: 400; }
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #020617; display: block !important; place-items: unset !important; min-width: 0 !important; }
        #root { max-width: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; text-align: left !important; display: block !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .safe-top { padding-top: env(safe-area-inset-top); }
        .pt-safe { padding-top: env(safe-area-inset-top); }
        .mt-safe { margin-top: env(safe-area-inset-top); }
        .pt-safe-offset { padding-top: calc(12px + env(safe-area-inset-top)); }
        /* Tap Highlight Removal */
        * { -webkit-tap-highlight-color: transparent; }
        *:focus { outline: none !important; }
      `}</style>
      <MainAppContent />
    </div>
  );
}