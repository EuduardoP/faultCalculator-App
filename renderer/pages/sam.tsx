import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/router';


export default function SamPage() {

  const router = useRouter()
  const { potencialBase, voltageBase } = router.query

  useEffect(() => {
    if (potencialBase && voltageBase) {
      console.log('Potencial Base:', potencialBase);
      console.log('Tensão Base:', voltageBase);
    }
  }, [potencialBase, voltageBase]);
  return (
    <React.Fragment>
      <Head>
        <title>Sistema em Anel Monofásico</title>
      </Head>
      <div className='flex flex-col bg-zinc-600 h-screen'>
        <header className='flex justify-start w-full p-4'>
          <Button asChild variant='outline'>
            <Link href="/home"><ArrowLeft />Voltar</Link>
          </Button>
          <nav className='flex flex-col gap-2 ml-5'>
            <Select>
              <SelectTrigger className="w-[180px]">
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
          </nav>
        </header>
        <main className='flex flex-1 flex-col bg-white p-4 m-4 rounded-lg shadow-lg justify-center items-center relative'>
          <h1 className='text-2xl font-bold text-zinc-900'>
            Sistema em Anel com Falta Monofásica
          </h1>
          <div className="relative" style={{ width: '500px' }}>
            <Image
              src="/images/srm.png"
              width={500}
              height={500}
              alt="Sistema Anel Monofásico"
              style={{ marginLeft: '-40px' }}
            />
            <div className="absolute inset-0 flex items-center mr-14 mb-2" style={{ marginLeft: '82px' }}>
              <Slider
                defaultValue={[50]}
                max={100}
                step={1}
                className='w-full'
                style={{ zIndex: 10 }}
              />
            </div>
          </div>
          <div className='flex flex-row gap-52'>
            <Input placeholder='SCC da barra A' className='w-32'/>
            <Input placeholder='SCC da barra B' className='w-32'/>
          </div>
          <Button>Calcular</Button>
        </main>
        <footer className='flex flex-col justify-start p-4 bg-slate-400 rounded-lg shadow-lg m-4'>
          <h1 className='text-2xl font-bold text-zinc-900'>
          Resultados    
          </h1>
          <p>Potencial Base: {potencialBase}</p>
          <p>Tensão Base: {voltageBase}</p>
          
        </footer>
      </div>
    </React.Fragment>
  )
}