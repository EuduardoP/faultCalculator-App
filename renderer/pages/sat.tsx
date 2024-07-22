import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FolderDown, TriangleAlert } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/router';
import { Label } from '@/components/ui/label';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { toast, useToast } from '@/components/ui/use-toast';
import { abs, arg,  complex } from 'mathjs';

interface Result {
  p: number
  icc_pu: string
  icc_amps: string
}

interface FormValues {
  powerA1: string
  powerAAngle1: string
  powerB1: string
  powerBAngle1: string
  powerA3: string
  powerAAngle3: string
  powerB3: string
  powerBAngle3: string
  deltaP: string
  selectValue: string
  selectError: boolean
}

export default function SamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { potencialBase, voltageBase } = router.query;
  const [formValues, setFormValues] = useState<FormValues>({
    powerA1: '',
    powerAAngle1: '',
    powerB1: '',
    powerBAngle1: '',
    powerA3: '',
    powerAAngle3: '',
    powerB3: '',
    powerBAngle3: '',
    deltaP: '',
    selectValue: '',
    selectError: false
  });
  const [results, setResults] = useState<Result[]>([]);
  const [chartData, setChartData] = useState([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormValues({
      ...formValues,
      [name]: value
    })
  }

  const handleSelectChange = (value: string) => {
    setFormValues({
      ...formValues,
      selectValue: value,
      selectError: false 
    })
  }

  const handleCalculate = () => {
    const { powerA1, powerAAngle1, powerB1, powerBAngle1, powerA3, powerAAngle3, powerB3, powerBAngle3, deltaP, selectValue } = formValues;

    if (selectValue === '') {
      setFormValues({
        ...formValues,
        selectError: true
      });
      return
    }

    const powerAValue1 = parseFloat(powerA1)
    const PowerAAngleValue1 = parseFloat(powerAAngle1) * Math.PI / 180
    const powerBValue1 = parseFloat(powerB1)
    const PowerBAngleValue1 = parseFloat(powerBAngle1) * Math.PI / 180
    const powerAValue3 = parseFloat(powerA3)
    const PowerAAngleValue3 = parseFloat(powerAAngle3) * Math.PI / 180
    const powerBValue3 = parseFloat(powerB3)
    const PowerBAngleValue3 = parseFloat(powerBAngle3) * Math.PI / 180
    const deltaPValue = parseFloat(deltaP)
    const potencialBaseValue = typeof potencialBase === 'string' ? parseFloat(potencialBase) : NaN
    const voltageBaseValue = typeof voltageBase === 'string' ? parseFloat(voltageBase) : NaN

    if (!isNaN(powerAValue1) && !isNaN(powerBValue1) && !isNaN(powerAValue3) && !isNaN(powerBValue3) && !isNaN(deltaPValue) && !isNaN(potencialBaseValue) && !isNaN(voltageBaseValue)) {
      const newResults: Result[] = []
      const newChartData: { deltaPGraph: string; pu: number; Ampers: number; }[] = []
      let adjustedPowerA1 = complex({ abs: powerAValue1, arg: PowerAAngleValue1 })
      let adjustedPowerB1 = complex({ abs: powerBValue1, arg: PowerBAngleValue1 })
      let adjustedPowerA3 = complex({ abs: powerAValue3, arg: PowerAAngleValue3 })
      let adjustedPowerB3 = complex({ abs: powerBValue3, arg: PowerBAngleValue3 })
      

      if (selectValue === 'MVA') {
        adjustedPowerA1 = adjustedPowerA1.div(potencialBaseValue)
        adjustedPowerB1 = adjustedPowerB1.div(potencialBaseValue)
      }
      for (let p = 0; p <= 100; p += deltaPValue) {
        const pValue = p / 100;
        const icc_radial_1_pu = adjustedPowerA1.mul(adjustedPowerB1).div((adjustedPowerA1.mul(pValue).add(adjustedPowerB1.mul(1 - pValue))));
        const i_base = potencialBaseValue / (Math.sqrt(3) * voltageBaseValue);
        const icc_radial_1 = icc_radial_1_pu.mul(i_base)
        newResults.push({ p, icc_pu: `${abs(icc_radial_1_pu).toFixed(4)}∡ ${(arg(icc_radial_1_pu) * 180 / Math.PI ).toFixed(2)}°`, icc_amps: `${abs(icc_radial_1).toFixed(4)} ∡ ${(arg(icc_radial_1) * 180 / Math.PI ).toFixed(2)}°` });
        newChartData.push({ deltaPGraph: `${p}%`, pu: abs(icc_radial_1_pu), Ampers: abs(icc_radial_1) });
      }
      setResults(newResults);
      setChartData(newChartData);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro nos dados',
        description: "Por favor, verifique se os dados da base estão corretos.",
      })
    }
  };

  const handleExport = () => {
    if (results.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro na exportação',
        description: "Não há dados para exportar.",
      })
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," +
      "Percentual,Icc_pu,Icc_A\n" +
      results.map(result => `${result.p}%,${result.icc_pu},${result.icc_amps}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "results.csv");
    document.body.appendChild(link);
    link.click();
  }

  const chartConfig = {
    desktop: {
      label: "pu",
      color: "hsl(var(--chart-2))",
    },
    mobile: {
      label: "Ampers",
      color: "hsl(var(--chart-2))",
    },
  } as ChartConfig;

  return (
    <React.Fragment>
      <Head>
        <title>Sistema em Anel Monofásico</title>
      </Head>
      <div className='flex flex-col bg-zinc-600 h-screen'>
        <header className='flex justify-start items-center w-full p-4'>
          <Button asChild variant='outline'>
            <Link href="/home"><ArrowLeft />Voltar</Link>
          </Button>
          <nav className='flex gap-2 ml-5 justify-start items-center bg-zinc-200 rounded-lg p-2 w-full'>
            <Label className='ml-2'>Como será inserido os dados: </Label>
            <Select value={formValues.selectValue} onValueChange={handleSelectChange}>
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Como será inserido os dados</SelectLabel>
                  <SelectItem value="pu">Potência de curto em p.u</SelectItem>
                  <SelectItem value="MVA">Potência de curto em MVA</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {!formValues.selectValue && <TriangleAlert color='red' />}
          </nav>
        </header>
        <main className='flex flex-1 flex-col bg-white p-4 m-4 rounded-lg justify-center items-center relative shadow-shape'>
          <h1 className='text-2xl font-bold text-zinc-900'>
            Sistema em Anel com Falta Trifásica
          </h1>
          <div className="relative py-4" style={{ width: '500px' }}>
            <Image
              src="/images/SAT.svg"
              width={500}
              height={500}
              alt="Sistema Anel Trifásica"
            />
          </div>
          <div className={`flex flex-row justify-center gap-6 mb-4 bg-zinc-100 p-2 rounded-lg border shadow-shape ${!formValues.selectValue ? 'text-zinc-400' : ''}`}>
            <div className='flex flex-col gap-2 '>
              <sub className='p-1'>SCC 1ɸ</sub>
              <div className='flex flex-row gap-2 '>
                <Input
                  placeholder='Módulo barra A'
                  className='w-32'
                  name='powerA1'
                  value={formValues.powerA1}
                  onChange={handleInputChange}
                  type='number'
                  disabled={!formValues.selectValue} 
                />
                <Input
                  placeholder='Ângulo barra A'
                  className='w-32'
                  name='powerAAngle1'
                  value={formValues.powerAAngle1}
                  onChange={handleInputChange}
                  type='number'
                  disabled={!formValues.selectValue} 
                />
              </div>
              <sub className='p-1'>SCC 3ɸ</sub>
              <div className='flex flex-row gap-2 '>
                <Input
                  placeholder='Módulo barra A'
                  className='w-32'
                  name='powerA3'
                  value={formValues.powerA3}
                  onChange={handleInputChange}
                  type='number'
                  disabled={!formValues.selectValue} 
                />
                <Input
                  placeholder='Ângulo barra A'
                  className='w-32'
                  name='powerAAngle3'
                  value={formValues.powerAAngle3}
                  onChange={handleInputChange}
                  type='number'
                  disabled={!formValues.selectValue} 
                />
              </div>
            </div>
            <div className='flex flex-col gap-2 justify-center items-center'>
                <sub className='p-1'> Impedância de sequência positiva da linha</sub>
                <div className='flex flex-row gap-2 '>
                <Input
                  placeholder='R da linha'
                  className='w-32'
                  name='powerA1'
                  value={formValues.powerA1}
                  onChange={handleInputChange}
                  type='number'
                  disabled={!formValues.selectValue} 
                />
                <Input
                  placeholder='X da linha'
                  className='w-32'
                  name='powerAAngle1'
                  value={formValues.powerAAngle1}
                  onChange={handleInputChange}
                  type='number'
                  disabled={!formValues.selectValue} 
                />
                </div>
                <Input
              placeholder='Δp%'
              className='w-14'
              name='deltaP'
              value={formValues.deltaP}
              onChange={handleInputChange}
              type='number'
              disabled={!formValues.selectValue}
            />
              </div>
            
            <div className='flex flex-col gap-2 '>
            
            <sub className='p-1'>SCC 1ɸ</sub>
              <div className='flex flex-row gap-2 '>
                <Input
                  placeholder='Módulo barra B'
                  className='w-32'
                  name='powerB1'
                  value={formValues.powerB1}
                  onChange={handleInputChange}
                  type='number'
                  disabled={!formValues.selectValue} 
                />
                <Input
                  placeholder='Ângulo barra B'
                  className='w-32'
                  name='powerBAngle1'
                  value={formValues.powerBAngle1}
                  onChange={handleInputChange}
                  type='number'
                  disabled={!formValues.selectValue} 
                />
              </div>
              <sub className='p-1'>SCC 3ɸ</sub>
              <div className='flex flex-row gap-2 '>
                <Input
                  placeholder='Módulo barra B'
                  className='w-32'
                  name='powerB3'
                  value={formValues.powerB3}
                  onChange={handleInputChange}
                  type='number'
                  disabled={!formValues.selectValue} 
                />
                <Input
                  placeholder='Ângulo barra B'
                  className='w-32'
                  name='powerBAngle3'
                  value={formValues.powerBAngle3}
                  onChange={handleInputChange}
                  type='number'
                  disabled={!formValues.selectValue} 
                />
              </div>
           
            </div>
          </div>

          <Drawer>
            <DrawerTrigger asChild>
              <Button onClick={handleCalculate} disabled={!formValues.selectValue}>Calcular</Button>
            </DrawerTrigger>
            <DrawerContent >
              <DrawerHeader>
                <DrawerTitle>Resultados:</DrawerTitle>
                <DrawerDescription>É possível exportar os resultados para uma tabela.</DrawerDescription>
              </DrawerHeader>

              <ChartContainer config={chartConfig} className='w-auto h-52 p-4'>
                <AreaChart data={chartData} syncId="shared">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={"deltaPGraph"}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickCount={10}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="pu"
                    type="natural"
                    fill="#f69b8b"
                    fillOpacity={0.4}
                    stroke="#f69b8b"
                    dot={true}
                  />
                  <Area
                    dataKey="Ampers"
                    type="natural"
                    fill="#60a5fa"
                    fillOpacity={0.4}
                    stroke="#60a5fa"
                    dot={true}
                  />
                </AreaChart>
              </ChartContainer>

              <div className="max-h-32 overflow-y-auto m-4">
                <table className='border border-collapse border-zinc-400 mt-4 w-full'>
                  <thead>
                    <tr className='bg-zinc-100'>
                      <th className='border border-zinc-400 px-2 py-1'>Percentual</th>
                      <th className='border border-zinc-400 bg-[#f69b8b]/50 px-2 py-1'>Icc 1ɸ(pu)</th>
                      <th className='border border-zinc-400 bg-[#60a5fa]/50 px-2 py-1'>Icc 1ɸ(A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index}>
                        <td className='border border-zinc-400 px-2 py-1'>{result.p}%</td>
                        <td className='border border-zinc-400 px-2 py-1'>{result.icc_pu}</td>
                        <td className='border border-zinc-400 px-2 py-1'>{result.icc_amps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Fechar</Button>
                </DrawerClose>
                <Button onClick={handleExport}><FolderDown className='mr-2 h-4 w-4' />Exportar Resultados</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </main>
      </div>
    </React.Fragment>
  );
}
