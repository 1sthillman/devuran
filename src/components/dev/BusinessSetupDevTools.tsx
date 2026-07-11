/**
 * ============================================================================
 * DEVELOPMENT TOOLS - İŞLETME SETUP DEBUG
 * ============================================================================
 * 
 * SADECE DEVELOPMENT MOD İÇİN
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, Eye, Code, CheckCircle, AlertTriangle } from 'lucide-react';
import type { BusinessSetupState } from '@/types/businessSetup';
import type { BusinessCapabilities } from '@/types/businessCapabilities';
import { validateCapabilities, validateSalon } from '@/utils/businessSetupValidator';
import { deriveCapabilitiesFromAnswers } from '@/utils/businessSetupEngine';

interface Props {
  state: BusinessSetupState;
  capabilities?: BusinessCapabilities;
}

export function BusinessSetupDevTools({ state, capabilities }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'state' | 'capabilities' | 'validation'>('state');

  // Sadece development modda göster
  if (import.meta.env.PROD) return null;

  const capValidation = capabilities ? validateCapabilities(capabilities) : null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
        title="Dev Tools"
      >
        <Bug className="w-6 h-6" />
      </button>

      {/* Dev Tools Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-gray-900 text-white z-[70] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="bg-purple-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bug className="w-5 h-5" />
                  <h3 className="font-bold">Business Setup Dev Tools</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-purple-700 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-700">
                {['state', 'capabilities', 'validation'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    {tab === 'state' && 'State'}
                    {tab === 'capabilities' && 'Capabilities'}
                    {tab === 'validation' && 'Validation'}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                {activeTab === 'state' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-purple-400 mb-2">Setup State</h4>
                      <pre className="bg-gray-800 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(state, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {activeTab === 'capabilities' && (
                  <div className="space-y-4">
                    {capabilities ? (
                      <>
                        <div>
                          <h4 className="text-sm font-bold text-purple-400 mb-2">Derived Capabilities</h4>
                          <pre className="bg-gray-800 p-3 rounded text-xs overflow-auto">
                            {JSON.stringify(capabilities, null, 2)}
                          </pre>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-800 p-3 rounded">
                            <p className="text-xs text-gray-400 mb-1">Booking Models</p>
                            <p className="text-sm font-semibold">
                              {capabilities.bookingModels.join(', ')}
                            </p>
                          </div>
                          <div className="bg-gray-800 p-3 rounded">
                            <p className="text-xs text-gray-400 mb-1">Capacity Unit</p>
                            <p className="text-sm font-semibold">{capabilities.capacityUnit}</p>
                          </div>
                          <div className="bg-gray-800 p-3 rounded">
                            <p className="text-xs text-gray-400 mb-1">Has Staff</p>
                            <p className="text-sm font-semibold">
                              {capabilities.hasStaff ? '✅ Yes' : '❌ No'}
                            </p>
                          </div>
                          <div className="bg-gray-800 p-3 rounded">
                            <p className="text-xs text-gray-400 mb-1">Has Tables</p>
                            <p className="text-sm font-semibold">
                              {capabilities.hasTables ? '✅ Yes' : '❌ No'}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">No capabilities yet</p>
                    )}
                  </div>
                )}

                {activeTab === 'validation' && (
                  <div className="space-y-4">
                    {capValidation ? (
                      <>
                        <div className={`p-4 rounded-lg ${
                          capValidation.isValid ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {capValidation.isValid ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <p className="font-bold text-green-400">Valid ✓</p>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                <p className="font-bold text-red-400">Invalid ✗</p>
                              </>
                            )}
                          </div>
                        </div>

                        {capValidation.errors.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-red-400 mb-2">Errors</h4>
                            <ul className="space-y-2">
                              {capValidation.errors.map((error, i) => (
                                <li key={i} className="bg-red-900/30 border border-red-700 p-2 rounded text-sm">
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {capValidation.warnings.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-yellow-400 mb-2">Warnings</h4>
                            <ul className="space-y-2">
                              {capValidation.warnings.map((warning, i) => (
                                <li key={i} className="bg-yellow-900/30 border border-yellow-700 p-2 rounded text-sm">
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">No validation data</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
