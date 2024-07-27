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
import math, { abs, arg,  Complex,  complex, MathType } from 'mathjs';

interface Result {
  p: number
  icc_pu: string
  icc_amps: string
}

interface FormValues {
  powerA: string
  powerAAngle: string
  powerB: string
  powerBAngle: string
  deltaP: string
  selectValue: string
  selectError: boolean
}

export default function SrtPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { potencialBase, voltageBase } = router.query;
  const [formValues, setFormValues] = useState<FormValues>({
    powerA: '',
    powerAAngle: '',
    powerB: '',
    powerBAngle: '',
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
    const { powerA, powerAAngle, powerB, powerBAngle,deltaP, selectValue } = formValues;

    if (selectValue === '') {
      setFormValues({
        ...formValues,
        selectError: true
      });
      return
    }

    const powerAValue = parseFloat(powerA)
    const PowerAAngleValue = parseFloat(powerAAngle) * Math.PI / 180
    const powerBValue = parseFloat(powerB)
    const PowerBAngleValue = parseFloat(powerBAngle) * Math.PI / 180
    const deltaPValue = parseFloat(deltaP)
    const potencialBaseValue = typeof potencialBase === 'string' ? parseFloat(potencialBase) : NaN
    const voltageBaseValue = typeof voltageBase === 'string' ? parseFloat(voltageBase) : NaN

    if (!isNaN(powerAValue) && !isNaN(powerBValue) && !isNaN(deltaPValue) && !isNaN(potencialBaseValue) && !isNaN(voltageBaseValue)) {
      const newResults: Result[] = []
      const newChartData: { deltaPGraph: string; pu: MathType; Ampers: MathType; }[] = []
      let adjustedPowerA: Complex = math.complex({ r: powerAValue, phi: PowerAAngleValue })
      let adjustedPowerB: Complex = math.complex({ r: powerBValue, phi: PowerBAngleValue })
      

      if (selectValue === 'MVA') {
        adjustedPowerA = math.divide(adjustedPowerA, potencialBaseValue) as Complex
        adjustedPowerB = math.divide(adjustedPowerB, potencialBaseValue) as Complex
      }
      for (let p = 0; p <= 100; p += deltaPValue) {
        const pValue = p / 100

        const icc_radial_1_pu: Complex = math.divide(
          math.multiply(adjustedPowerA, adjustedPowerB),
          math.add(
            math.multiply(adjustedPowerA, pValue),
            math.multiply(adjustedPowerB, 1 - pValue)
          )
        ) as Complex
        const i_base = math.divide(potencialBaseValue, math.multiply(math.sqrt(3), voltageBaseValue))

        const icc_radial_1: Complex = math.multiply(icc_radial_1_pu, i_base) as Complex

        const absIccRadial1Pu = math.abs(icc_radial_1_pu) as unknown as number
        const argIccRadial1Pu = math.arg(icc_radial_1_pu) as unknown as number
        const absIccRadial1 = math.abs(icc_radial_1) as unknown as number
        const argIccRadial1 = math.arg(icc_radial_1) as unknown as number
        newResults.push({ 
          p, 
          icc_pu: `${absIccRadial1Pu.toFixed(4)}∡ ${(argIccRadial1Pu * 180 / Math.PI ).toFixed(2)}°`, 
          icc_amps: `${absIccRadial1.toFixed(4)} ∡ ${(argIccRadial1 * 180 / Math.PI ).toFixed(2)}°` 
        })
        newChartData.push({ 
          deltaPGraph: `${p}%`, 
          pu: abs(icc_radial_1_pu), 
          Ampers: abs(icc_radial_1) 
        })
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

  const handleBlur = (value: string) => {
    const powerAngle = parseFloat(value) || 0

    if (powerAngle > 0) {
      toast({
        variant: 'destructive',
        title: 'Erro nos dados',
        description: "Ângulos devem ser conjugados.",
      })
      return
    }
  }

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
        <title>Sistema Radial Trifásica</title>
      </Head>
      <div className='flex flex-col bg-zinc-600 h-screen'>
        <header className='flex justify-start items-center w-full p-4'>
          <Button asChild variant='outline'>
            <Link href={{
                pathname: '/home',
                query: { ...router.query }
              }}><ArrowLeft />Voltar</Link>
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
                  <SelectItem value="pu">Sistema p.u</SelectItem>
                  <SelectItem value="MVA">Potência em MVA</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {!formValues.selectValue && <TriangleAlert color='red' />}
          </nav>
        </header>
        <main className='flex flex-1 flex-col bg-white p-4 m-4 rounded-lg justify-center items-center relative shadow-shape'>
          <h1 className='text-2xl font-bold text-zinc-900'>
            Sistema Radial com Falta Trifásica
          </h1>
          <div className="relative py-4" style={{ width: '500px' }}>
            <Image
              src="/images/SRT.svg"
              width={500}
              height={500}
              alt="Sistema Radial Trifásica"
              style={{ marginLeft: '-40px' }}
            />
          </div>
          <div className='flex flex-row justify-center items-center gap-14 mb-4 bg-zinc-100 p-2 rounded-lg border shadow-shape'>
            <div className='flex flex-col gap-2 '>
              <Input
                placeholder='Módulo barra A'
                className='w-32'
                name='powerA'
                value={formValues.powerA}
                onChange={handleInputChange}
                type='number'
                disabled={!formValues.selectValue}
                
              />
              <Input
                placeholder='Ângulo barra A'
                className='w-32'
                name='powerAAngle'
                value={formValues.powerAAngle}
                onChange={handleInputChange}
                type='number'
                disabled={!formValues.selectValue}
                onBlur={(e) => handleBlur(e.target.value)}
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
            <div className='flex flex-col gap-2 '>
              <Input
                placeholder='Módulo barra B'
                className='w-32'
                name='powerB'
                value={formValues.powerB}
                onChange={handleInputChange}
                type='number'
                disabled={!formValues.selectValue}
              />
              <Input
                placeholder='Ângulo barra B'
                className='w-32'
                name='powerBAngle'
                value={formValues.powerBAngle}
                onChange={handleInputChange}
                type='number'
                disabled={!formValues.selectValue}
                onBlur={(e) => handleBlur(e.target.value)}
              />
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
                      <th className='border border-zinc-400 bg-[#f69b8b]/50 px-2 py-1'>Icc 3ɸ(pu)</th>
                      <th className='border border-zinc-400 bg-[#60a5fa]/50 px-2 py-1'>Icc 3ɸ(kA)</th>
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
