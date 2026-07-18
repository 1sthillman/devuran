import { useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * FIRESTORE DIAGNOSTIC TOOL
 * Restoran rezervasyon sorununu debug etmek için
 */
export function FirestoreDiagnostic() {
  const [salonId, setSalonId] = useState('nkSO1R145VhqxiB0F7Tjr');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const diagnosticResult: any = {
      timestamp: new Date().toISOString(),
      salonId,
      checks: {}
    };

    try {
      // CHECK 1: Salon document exists?
      console.log(`🔍 CHECK 1: Checking salon document...`);
      const salonRef = doc(db, 'salons', salonId);
      const salonSnap = await getDoc(salonRef);
      
      diagnosticResult.checks.salonExists = salonSnap.exists();
      
      if (salonSnap.exists()) {
        const salonData = salonSnap.data();
        diagnosticResult.checks.salonData = {
          name: salonData.name,
          category: salonData.category,
          hasServicesField: 'services' in salonData,
          servicesType: Array.isArray(salonData.services) ? 'array' : typeof salonData.services,
          servicesLength: Array.isArray(salonData.services) ? salonData.services.length : 0,
          servicesPreview: Array.isArray(salonData.services) 
            ? salonData.services.slice(0, 3).map((s: any) => ({ id: s.id, name: s.name }))
            : null
        };
        
        console.log(`✅ Salon found:`, salonData.name);
        console.log(`📋 Category:`, salonData.category);
        console.log(`📋 services field exists:`, 'services' in salonData);
        console.log(`📋 services value:`, salonData.services);
      } else {
        console.error(`❌ Salon NOT FOUND in Firestore!`);
      }

      // CHECK 2: Services collection
      console.log(`🔍 CHECK 2: Checking services collection...`);
      const servicesQuery = query(
        collection(db, 'services'),
        where('salonId', '==', salonId)
      );
      const servicesSnap = await getDocs(servicesQuery);
      
      diagnosticResult.checks.servicesCollection = {
        count: servicesSnap.size,
        services: servicesSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          category: doc.data().category
        }))
      };
      
      console.log(`📦 Services in collection:`, servicesSnap.size);
      servicesSnap.docs.forEach(doc => {
        console.log(`  - ${doc.data().name} (${doc.id})`);
      });

      // CHECK 3: All salons IDs (find similar IDs)
      console.log(`🔍 CHECK 3: Finding similar salon IDs...`);
      const allSalonsSnap = await getDocs(collection(db, 'salons'));
      const similarIds = allSalonsSnap.docs
        .map(doc => ({ id: doc.id, name: doc.data().name }))
        .filter(s => 
          s.id.toLowerCase().includes('nk') || 
          s.name?.toLowerCase().includes('cafe') ||
          s.name?.toLowerCase().includes('st')
        );
      
      diagnosticResult.checks.similarSalons = similarIds;
      console.log(`🔎 Similar salon IDs:`, similarIds);

      setResult(diagnosticResult);
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      diagnosticResult.error = error;
      setResult(diagnosticResult);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-2xl z-[100000]">
      <h3 className="text-white font-bold mb-2">🔍 Firestore Diagnostic</h3>
      
      <input
        type="text"
        value={salonId}
        onChange={(e) => setSalonId(e.target.value)}
        placeholder="Salon ID"
        className="w-full px-3 py-2 bg-gray-800 text-white rounded mb-2 text-sm"
      />
      
      <button
        onClick={runDiagnostic}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run Diagnostic'}
      </button>
      
      {result && (
        <div className="mt-4 max-h-96 overflow-auto">
          <pre className="text-xs text-green-400 bg-gray-950 p-3 rounded whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
