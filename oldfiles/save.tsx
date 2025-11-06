'use client'

import { useState } from 'react'
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Plus, Trash2, Loader2 } from 'lucide-react'

interface CompanyDetails {
  naics: string
  identifier: {
    uei: string
  }
  size_basis: {
    kind: string
    value: number
  }
}

interface EligibilityResponse {
  eligible: boolean
  summary: string
  reasons: Array<{
    code: string
    message: string
  }>
  sam: {
    uei: string
    cage: string
    active: boolean
  }
  exclusions: {
    count: number
    hits: unknown[]
  }
  size: {
    status: string
    basis: string
    threshold: number
    unit: string
    naics: string
  }
  evidence: Array<{
    source: string
    reference: string
    fetched_at: string
  }>
}

interface BulkCompanyDetails extends CompanyDetails {
  id: string
  companyName?: string
}

const EligibilityChecker = () => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')

  // Single mode state
  const [singleCompany, setSingleCompany] = useState<CompanyDetails>({
    naics: '',
    identifier: { uei: '' },
    size_basis: { kind: 'receipts', value: 0 }
  })
  const [singleResult, setSingleResult] = useState<EligibilityResponse | null>(null)

  // Bulk mode state
  const [bulkCompanies, setBulkCompanies] = useState<BulkCompanyDetails[]>([
    {
      id: '1',
      naics: '',
      identifier: { uei: '' },
      size_basis: { kind: 'receipts', value: 0 },
      companyName: ''
    }
  ])
  const [bulkResults, setBulkResults] = useState<(EligibilityResponse & { id: string, companyName?: string })[]>([])

  const addBulkCompany = () => {
    const newId = (bulkCompanies.length + 1).toString()
    setBulkCompanies([
      ...bulkCompanies,
      {
        id: newId,
        naics: '',
        identifier: { uei: '' },
        size_basis: { kind: 'receipts', value: 0 },
        companyName: ''
      }
    ])
  }

  const removeBulkCompany = (id: string) => {
    setBulkCompanies(bulkCompanies.filter(company => company.id !== id))
  }

  const updateBulkCompany = (id: string, field: string, value: string | number) => {
    setBulkCompanies(companies =>
      companies.map(company => {
        if (company.id === id) {
          if (field.includes('.')) {
            const [parent, child] = field.split('.')
            const parentValue = company[parent as keyof BulkCompanyDetails]
            
            // Ensure we're only spreading object types
            if (typeof parentValue === 'object' && parentValue !== null) {
              return {
                ...company,
                [parent]: {
                  ...parentValue,
                  [child]: value
                }
              }
            }
          }
          return { ...company, [field]: value }
        }
        return company
      })
    )
  }

  const checkEligibility = async (companyData: CompanyDetails) => {
    const response = await fetch('https://api.tideiq.io/v1/eligibility/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(companyData)
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return response.json()
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey) {
      alert('Please enter your API key')
      return
    }

    setLoading(true)
    try {
      const result = await checkEligibility(singleCompany)
      setSingleResult(result)
    } catch (error) {
      console.error('Error checking eligibility:', error)
      alert('Error checking eligibility. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey) {
      alert('Please enter your API key')
      return
    }

    setLoading(true)
    setBulkResults([])
    
    try {
      const results = []
      for (const company of bulkCompanies) {
        try {
          const result = await checkEligibility({
            naics: company.naics,
            identifier: company.identifier,
            size_basis: company.size_basis
          })
          results.push({
            ...result,
            id: company.id,
            companyName: company.companyName
          })
        } catch (error) {
          console.error(`Error checking eligibility for company ${company.id}:`, error)
          results.push({
            id: company.id,
            companyName: company.companyName,
            eligible: false,
            summary: 'Error occurred during check',
            reasons: [{ code: 'ERROR', message: 'Failed to check eligibility' }],
            sam: { uei: '', cage: '', active: false },
            exclusions: { count: 0, hits: [] },
            size: { status: 'unknown', basis: '', threshold: 0, unit: '', naics: '' },
            evidence: []
          })
        }
      }
      setBulkResults(results)
    } finally {
      setLoading(false)
    }
  }

  const EligibilityResult = ({ result, companyName }: { result: EligibilityResponse, companyName?: string }) => (
    <Card className={`mt-6 ${result.eligible ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {companyName && <span className="text-lg">{companyName}</span>}
          {result.eligible ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6 animate-bounce" />
              <span className="text-xl font-bold animate-pulse">ELIGIBLE! 🎉</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-6 h-6" />
              <span className="text-xl font-bold">NOT ELIGIBLE</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-600">SUMMARY</h4>
            <p className="text-sm">{result.summary}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-gray-600">REASONS</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {result.reasons.map((reason, index) => (
                <Badge 
                  key={index} 
                  variant={reason.code.includes('NO_EXCLUSIONS') || reason.code.includes('SAM_ACTIVE') || reason.code.includes('SIZE_SMALL') ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {reason.message}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-600">SAM STATUS</h4>
              <p>UEI: {result.sam.uei}</p>
              <p>CAGE: {result.sam.cage}</p>
              <p>Active: {result.sam.active ? '✅' : '❌'}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-600">SIZE STATUS</h4>
              <p>Status: <Badge variant={result.size.status === 'small' ? 'default' : 'secondary'}>{result.size.status.toUpperCase()}</Badge></p>
              <p>Threshold: {result.size.threshold.toLocaleString()} {result.size.unit}</p>
              <p>NAICS: {result.size.naics}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-600">EXCLUSIONS</h4>
              <p>Count: {result.exclusions.count}</p>
              <p>Status: {result.exclusions.count === 0 ? '✅ Clean' : '❌ Has exclusions'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Eligibility Checker</h1>
          <p className="text-gray-600 mt-2">Check company eligibility for government contracts</p>
        </div>

        {/* API Key Input */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your x-api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1"
            />
          </CardContent>
        </Card>

        <Tabs value={mode} onValueChange={(value) => setMode(value as 'single' | 'bulk')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Check</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Check</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="naics">NAICS Code</Label>
                    <Input
                      id="naics"
                      placeholder="e.g., 541511"
                      value={singleCompany.naics}
                      onChange={(e) => setSingleCompany({...singleCompany, naics: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="uei">UEI</Label>
                    <Input
                      id="uei"
                      placeholder="e.g., XFJMYSYFJEK4"
                      value={singleCompany.identifier.uei}
                      onChange={(e) => setSingleCompany({
                        ...singleCompany,
                        identifier: { uei: e.target.value }
                      })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sizeBasisKind">Size Basis</Label>
                      <Select 
                        value={singleCompany.size_basis.kind} 
                        onValueChange={(value) => setSingleCompany({
                          ...singleCompany,
                          size_basis: { ...singleCompany.size_basis, kind: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select basis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receipts">Receipts</SelectItem>
                          <SelectItem value="employees">Employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sizeBasisValue">Size Value</Label>
                      <Input
                        id="sizeBasisValue"
                        type="number"
                        placeholder="e.g., 34500000"
                        value={singleCompany.size_basis.value}
                        onChange={(e) => setSingleCompany({
                          ...singleCompany,
                          size_basis: { ...singleCompany.size_basis, value: Number(e.target.value) }
                        })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Check Eligibility
                  </Button>
                </form>

                {singleResult && <EligibilityResult result={singleResult} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Bulk Check
                  <Button onClick={addBulkCompany} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBulkSubmit} className="space-y-6">
                  {bulkCompanies.map((company, index) => (
                    <Card key={company.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">{/*Company {index + 1} */}</h4>
                        {bulkCompanies.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeBulkCompany(company.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {/* <div>
                          <Label>Company Name (Optional)</Label>
                          <Input
                            placeholder="Company name"
                            value={company.companyName || ''}
                            onChange={(e) => updateBulkCompany(company.id, 'companyName', e.target.value)}
                          />
                        </div> */}

                        <div>
                          <Label>NAICS Code</Label>
                          <Input
                            placeholder="e.g., 541511"
                            value={company.naics}
                            onChange={(e) => updateBulkCompany(company.id, 'naics', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <Label>UEI</Label>
                          <Input
                            placeholder="e.g., XFJMYSYFJEK4"
                            value={company.identifier.uei}
                            onChange={(e) => updateBulkCompany(company.id, 'identifier.uei', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <Label>Size Basis</Label>
                          <Select 
                            value={company.size_basis.kind}
                            onValueChange={(value) => updateBulkCompany(company.id, 'size_basis.kind', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select basis" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="receipts">Receipts</SelectItem>
                              <SelectItem value="employees">Employees</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Size Value</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 34500000"
                            value={company.size_basis.value}
                            onChange={(e) => updateBulkCompany(company.id, 'size_basis.value', Number(e.target.value))}
                            required
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Check All Companies
                  </Button>
                </form>

                {bulkResults.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-xl font-semibold">Results</h3>
                    {bulkResults.map((result) => (
                      <EligibilityResult 
                        key={result.id} 
                        result={result} 
                        companyName={result.companyName}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export default EligibilityChecker