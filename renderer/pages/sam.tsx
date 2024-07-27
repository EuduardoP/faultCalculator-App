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
import {  useToast } from '@/components/ui/use-toast';
import { create, all, abs, arg, Complex, MathType} from 'mathjs';

const config = {}
const math = create(all, config);

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
  zLT0: string
  zLT1: string
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
    zLT0: '',
    zLT1: '',
    selectError: false
  });
  const [results, setResults] = useState<Result[]>([])
  const [chartData, setChartData] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const complexNumberRegex = /^-?\d+(\.\d+)?\s*([+-]\s*\d+(\.\d+)?)?i$/

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormValues({
      ...formValues,
      [name]: value
    })
  }

  const areAllFieldsFilled = () => {
    // Campos obrigatórios
    const { powerA3, powerAAngle3, powerA1, powerAAngle1, powerB3, powerBAngle3, powerB1, powerBAngle1, deltaP, zLT1, zLT0 } = formValues
    
    // Verifique se todos os campos obrigatórios estão preenchidos
    return [powerA3, powerAAngle3, powerA1, powerAAngle1, powerB3, powerBAngle3, powerB1, powerBAngle1, deltaP, zLT1, zLT0].every(value => value.trim() !== '') && formValues.selectValue !== ''
  }

  const handleSelectChange = (value: string) => {
    setFormValues({
      ...formValues,
      selectValue: value,
      selectError: false 
    })
  }

  const handleCalculate = () => {
    const {
      powerA3, powerA1, powerAAngle3, powerAAngle1, 
      powerB3, powerB1, powerBAngle3, powerBAngle1,
      deltaP, selectValue 
    } = formValues

  const powerAValue1 = parseFloat(powerA1 as string) || 0;
  const PowerAAngleValue1 = parseFloat(powerAAngle1 as string) * Math.PI / 180 || 0;
  const powerBValue1 = parseFloat(powerB1 as string) || 0;
  const PowerBAngleValue1 = parseFloat(powerBAngle1 as string) * Math.PI / 180 || 0;
  const powerAValue3 = parseFloat(powerA3 as string) || 0;
  const PowerAAngleValue3 = parseFloat(powerAAngle3 as string) * Math.PI / 180 || 0;
  const powerBValue3 = parseFloat(powerB3 as string) || 0;
  const PowerBAngleValue3 = parseFloat(powerBAngle3 as string) * Math.PI / 180 || 0;
  const deltaPValue = parseFloat(deltaP as string) || 0;
  const potencialBaseValue = parseFloat(potencialBase as string) || 0;
  const voltageBaseValue = parseFloat(voltageBase as string) || 0;
  const impedanceBaseValue = (voltageBaseValue * voltageBaseValue) / potencialBaseValue || 0;

  if (potencialBaseValue > 0 && voltageBaseValue > 0 && impedanceBaseValue > 0) {
      const newResults: Result[] = []
      const newChartData: { deltaPGraph: string; pu: MathType; Ampers: MathType; }[] = []
      let adjustedPowerA3: Complex = math.complex({ r: powerAValue3, phi: PowerAAngleValue3 })
      let adjustedPowerB3: Complex = math.complex({ r: powerBValue3, phi: PowerBAngleValue3 })
      let adjustedPowerA1: Complex = math.complex({ r: powerAValue1, phi: PowerAAngleValue1 })
      let adjustedPowerB1: Complex = math.complex({ r: powerBValue1, phi: PowerBAngleValue1 })
      

      if (selectValue === 'MVA') {
        adjustedPowerA3 = math.divide(adjustedPowerA3, potencialBaseValue) as Complex
        adjustedPowerB3 = math.divide(adjustedPowerB3, potencialBaseValue) as Complex
        adjustedPowerA1 = math.divide(adjustedPowerA1, potencialBaseValue) as Complex
        adjustedPowerB1 = math.divide(adjustedPowerB1, potencialBaseValue) as Complex
      }
      const zLT = {
        zLT1: math.divide(math.complex(formValues.zLT1), impedanceBaseValue) as Complex,
        zLT0: math.divide(math.complex(formValues.zLT0), impedanceBaseValue) as Complex
      }

      const R = math.subtract(
        math.divide(3,adjustedPowerA1),
        math.divide(2,adjustedPowerA3)
      ) as Complex

      const W = math.subtract(
        math.divide(3,adjustedPowerB1),
        math.divide(2,adjustedPowerB3)
      ) as Complex
      const findPositiveRealComplex = (roots) => {
        for (const root of roots) {
          const realPart = math.re(root)as unknown as number;
          if (realPart > 0) {
            return root;
          }
        }
        return null;
      }

      const zeroRoots = math.polynomialRoot(
        math.multiply(R,math.pow(zLT.zLT0,2)) as unknown as Complex,
        math.multiply(zLT.zLT0,math.subtract(math.multiply(2,R),zLT.zLT0)) as unknown as Complex,
        math.subtract(math.subtract(R,W),zLT.zLT0) as unknown as Complex
      )

      const positiveRoots = math.polynomialRoot(
        math.multiply(adjustedPowerA3,math.pow(zLT.zLT1,2)) as unknown as Complex,
        math.multiply(adjustedPowerA3,zLT.zLT1,math.subtract(2,math.multiply(adjustedPowerB3,zLT.zLT1))) as unknown as Complex,
        math.subtract(math.subtract(adjustedPowerA3,adjustedPowerB3),math.multiply(adjustedPowerA3,adjustedPowerB3,zLT.zLT1)) as unknown as Complex
      )
      
      const zb1 = findPositiveRealComplex(positiveRoots);
      const za0 = findPositiveRealComplex(zeroRoots);

      if (!zb1 || !za0 ) {
        toast({
          variant: 'destructive',
          title: 'O problema não há solução',
          description: "Não foram encontrados raízes para a equação.",
        })
        setDrawerOpen(false)
        return
      } else {
        setDrawerOpen(true)
      }
 

      const za1 = math.divide(
        math.add(zb1,zLT.zLT1),
        math.subtract(math.multiply(
          adjustedPowerA3,
          math.add(zb1,zLT.zLT1)
        ),1)
      )
      
      const zb0 = math.divide(
        math.add(
          math.multiply(R,za0),
          math.subtract(0,math.multiply(zLT.zLT0,za0)),
          math.multiply(R,zLT.zLT0),
        ),
        math.subtract(za0,R)
      )
      for (let p = 0; p <= 100; p += deltaPValue) {
        const pValue = p / 100
        
        const icc_radial_1_pu: Complex = math.divide(
          3,
          math.add(
            math.multiply(2,
              math.divide(math.multiply(
                math.add(za1,math.multiply(pValue,zLT.zLT1)),
                math.add(zb1,math.multiply(1-pValue,zLT.zLT1))
              ),math.add(za1,zb1,zLT.zLT1))
            ),
            math.divide(math.multiply(
              math.add(za0,math.multiply(pValue,zLT.zLT0)),
              math.add(zb0,math.multiply(1-pValue,zLT.zLT0))
            ),
            math.add(za0,zb0,zLT.zLT0))
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
      setResults(newResults)
      setChartData(newChartData)
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro nos dados',
        description: "Por favor, verifique se os dados da base estão corretos e todos os campos estão preenchidos.",
      })
    }
  }

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

  const handleComplexBlur = (value: string) => {

    if (!complexNumberRegex.test(value)) {
      toast({
        variant: 'destructive',
        title: 'Erro na entrada',
        description: "O valor da entrada deve ser do formato 'a + bi",
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
        <title>Sistema em Anel Monofásico</title>
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
            Sistema em Anel com Falta Monofásica
          </h1>
          <div className="relative py-4" style={{ width: '500px' }}>
            <Image
              src="/images/SAM.svg"
              width={500}
              height={500}
              alt="Sistema Anel Monofásico"
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
                  onBlur={(e)=> handleBlur(e.target.value)}
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
                  onBlur={(e)=> handleBlur(e.target.value)}
                />
              </div>
            </div>
            <div className='flex flex-col gap-2 justify-center items-center'>
              <sub className='p-1'> Impedância de sequência positiva da linha</sub>
                <div className='flex flex-row gap-2 '>
                <Input
                  placeholder='Ex: 4 + 2i'
                  className='w-32'
                  name='zLT1'
                  value={formValues.zLT1}
                  onChange={handleInputChange}
                  type='text'
                  disabled={!formValues.selectValue}
                  onBlur={(e)=> handleComplexBlur(e.target.value)}
                />
                </div>
                <sub className='p-1'> Impedância de sequência zero da linha</sub>
                <div className='flex flex-row gap-2 '>
                <Input
                  placeholder='Ex: 0.6 + 2i'
                  className='w-32'
                  name='zLT0'
                  value={formValues.zLT0}
                  onChange={handleInputChange}
                  type='text'
                  disabled={!formValues.selectValue}
                  onBlur={(e)=> handleComplexBlur(e.target.value)}
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
                  onBlur={(e)=> handleBlur(e.target.value)}
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
                  onBlur={(e)=> handleBlur(e.target.value)}

                />
              </div>
           
            </div>
          </div>

          <Drawer open={drawerOpen}>
            <DrawerTrigger asChild>
              <Button onClick={handleCalculate} disabled={!areAllFieldsFilled()}>Calcular</Button>
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
                      <th className='border border-zinc-400 bg-[#60a5fa]/50 px-2 py-1'>Icc 1ɸ(kA)</th>
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
                  <Button variant="outline" onClick={()=> setDrawerOpen(false)}>Fechar</Button>
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
