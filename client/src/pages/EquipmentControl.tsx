import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

type ActionType = 'withdraw' | 'return' | null;

export default function EquipmentControl() {
  const [actionType, setActionType] = useState<ActionType>(null);
  const [patrimonyNumber, setPatrimonyNumber] = useState('');
  const [cpf, setCpf] = useState('');
  const [observations, setObservations] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patrimonyNumber.trim()) {
      toast.error('Por favor, informe o número de patrimônio');
      return;
    }

    if (!cpf.trim() || cpf.length < 11) {
      toast.error('Por favor, informe um CPF válido (apenas números)');
      return;
    }

    if (!observations.trim()) {
      toast.error('Por favor, informe o estado do equipamento');
      return;
    }

    setIsLoading(true);

    try {
      const recordData = {
        patrimonyNumber: patrimonyNumber.trim(),
        cpf: cpf.trim(),
        actionType: actionType,
        observations: observations.trim(),
        timestamp: Timestamp.now(),
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR'),
      };

      const docRef = await addDoc(collection(db, 'equipment_records'), recordData);

      toast.success(
        actionType === 'withdraw'
          ? 'Equipamento retirado com sucesso!'
          : 'Equipamento devolvido com sucesso!',
        {
          description: `Número de patrimônio: ${patrimonyNumber}`,
        }
      );

      // Limpar formulário
      setPatrimonyNumber('');
      setCpf('');
      setObservations('');
      setActionType(null);
    } catch (error) {
      console.error('Erro ao registrar:', error);
      toast.error('Erro ao registrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchHistory = async () => {
    if (!startDate || !endDate) {
      toast.error('Por favor, informe ambas as datas');
      return;
    }

    setIsLoadingHistory(true);

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'equipment_records'),
        where('timestamp', '>=', Timestamp.fromDate(start)),
        where('timestamp', '<=', Timestamp.fromDate(end))
      );

      const querySnapshot = await getDocs(q);
      const records: any[] = [];

      querySnapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setHistoryRecords(records);

      if (records.length === 0) {
        toast.info('Nenhum registro encontrado para o período selecionado');
      } else {
        toast.success(`${records.length} registro(s) encontrado(s)`);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast.error('Erro ao buscar histórico. Tente novamente.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const exportToCSV = () => {
    if (historyRecords.length === 0) {
      toast.error('Nenhum registro para exportar');
      return;
    }

    const headers = ['Data', 'Hora', 'Ação', 'Número de Patrimônio', 'CPF', 'Observações'];
    const rows = historyRecords.map((record) => [
      record.date,
      record.time,
      record.actionType === 'withdraw' ? 'Retirada' : 'Devolução',
      record.patrimonyNumber,
      record.cpf,
      record.observations,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_equipamentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sistema de Controle de Equipamentos
          </h1>
          <p className="text-gray-600">
            Registre retiradas e devoluções de equipamentos móveis
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle>Registrar Operação</CardTitle>
            <CardDescription className="text-blue-100">
              Selecione a ação, informe os dados e confirme
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={actionType === 'withdraw' ? 'default' : 'outline'}
                  className={`h-24 text-lg font-semibold transition-all ${
                    actionType === 'withdraw'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'hover:bg-green-50'
                  }`}
                  onClick={() => setActionType('withdraw')}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    Retirar
                  </div>
                </Button>

                <Button
                  type="button"
                  variant={actionType === 'return' ? 'default' : 'outline'}
                  className={`h-24 text-lg font-semibold transition-all ${
                    actionType === 'return'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'hover:bg-orange-50'
                  }`}
                  onClick={() => setActionType('return')}
                >
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-6 h-6" />
                    Devolver
                  </div>
                </Button>
              </div>

              {/* Patrimony Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Patrimônio
                </label>
                <Input
                  type="text"
                  placeholder="Digite o número de patrimônio"
                  value={patrimonyNumber}
                  onChange={(e) => setPatrimonyNumber(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF (apenas números)
                </label>
                <Input
                  type="text"
                  placeholder="Digite seu CPF"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  className="w-full"
                />
              </div>

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado do Equipamento / Observações
                </label>
                <Textarea
                  placeholder="Descreva o estado do equipamento ou qualquer inconformidade"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full min-h-24"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !actionType}
                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Registrando...' : 'Confirmar Registro'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Button */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-12 text-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Clock className="w-5 h-5 mr-2" />
              Buscar Histórico
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico de Registros</DialogTitle>
              <DialogDescription>
                Busque registros por período de datas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Date Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearchHistory}
                disabled={isLoadingHistory}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoadingHistory ? 'Buscando...' : 'Buscar Registros'}
              </Button>

              {/* Results */}
              {historyRecords.length > 0 && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="px-4 py-2 text-left font-semibold">Data</th>
                          <th className="px-4 py-2 text-left font-semibold">Hora</th>
                          <th className="px-4 py-2 text-left font-semibold">Ação</th>
                          <th className="px-4 py-2 text-left font-semibold">Patrimônio</th>
                          <th className="px-4 py-2 text-left font-semibold">CPF</th>
                          <th className="px-4 py-2 text-left font-semibold">Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyRecords.map((record) => (
                          <tr key={record.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{record.date}</td>
                            <td className="px-4 py-2">{record.time}</td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                                  record.actionType === 'withdraw'
                                    ? 'bg-green-600'
                                    : 'bg-orange-600'
                                }`}
                              >
                                {record.actionType === 'withdraw' ? 'Retirada' : 'Devolução'}
                              </span>
                            </td>
                            <td className="px-4 py-2">{record.patrimonyNumber}</td>
                            <td className="px-4 py-2">{record.cpf}</td>
                            <td className="px-4 py-2 text-gray-600">{record.observations}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Export Button */}
                  <Button
                    onClick={exportToCSV}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Exportar para CSV
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
