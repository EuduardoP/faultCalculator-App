import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Bolt, Check, CircleX } from 'lucide-react';
import { useRouter } from 'next/router';


export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [voltageBase, setVoltageBase] = useState('')
  const [potencialBase, setPotencialBase] = useState('')

  useEffect(() => {

    if (Object.keys(router.query).length > 0) {
      setIsOpen(false)
    } else {
      setIsOpen(true)
    }

    if (router.query.voltageBase) {
      setVoltageBase(router.query.voltageBase as string)
    }
    if (router.query.potencialBase) {
      setPotencialBase(router.query.potencialBase as string)
    }
  }, [router.query])


  const variant = Number(voltageBase) > 0 && Number(potencialBase) > 0 ? 'default' : 'destructive'
  const title = Number(voltageBase) > 0 && Number(potencialBase) > 0 ? 'Bases configuradas' : 'Erro nas bases'
  const action = Number(voltageBase) > 0 && Number(potencialBase) > 0 ? <Check /> : <CircleX />
  const handleApply = () => {
    setIsOpen(false)
    toast({
      variant: variant,
      title: title,
      description: `Tensão Base: ${voltageBase}kV Potência Base: ${potencialBase}MVA`,
      action: action
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <React.Fragment>
      <Head>
        <title>Calculo da falta em p% da linha</title>
      </Head>
      <div className='flex flex-col h-screen bg-zinc-600 bg-pattern bg-no-repeat bg-center'>
        <header className='flex justify-end w-full p-4'>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className='gap-2'>
                <Bolt /> Configurações
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Bases do sistema</DialogTitle>
                <DialogDescription>
                  Configure as bases do sistema
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="voltage" className="text-right">
                    Tensão Nominal
                  </Label>
                  <Input
                    id="voltage"
                    className="col-span-3"
                    placeholder='Dados em kV'
                    value={voltageBase}
                    onChange={(e) => setVoltageBase(e.target.value)}
                    onKeyDown={handleKeyDown}
                    type='number'
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="potencial" className="text-right">
                    Potência Nominal
                  </Label>
                  <Input
                    id="potencial"
                    className="col-span-3"
                    placeholder='Dados em MVA'
                    value={potencialBase}
                    onChange={(e) => setPotencialBase(e.target.value)}
                    onKeyDown={handleKeyDown}
                    type='number'
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleApply}>
                  Aplicar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>
        <main className="flex-1 flex flex-col justify-center items-center p-4">
          <div className='flex flex-col justify-center items-center space-y-24 w-full'>
            <h1 className='text-5xl font-bold text-zinc-200 text-center'>
              Cálculo de Falta Deslizante
            </h1>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
           <Button asChild className="shadow-shape">
              <Link  href={{
                pathname: "/sam",
                query:{
                  voltageBase: voltageBase,
                  potencialBase: potencialBase
                },
            }}
                >Sistema em Anel Monofásico</Link>
            </Button >
            <Button asChild className="shadow-shape">
              <Link  href={{
                pathname: "/sat",
                query:{
                  voltageBase: voltageBase,
                  potencialBase: potencialBase
                },
            }}
                >Sistema em Anel Trifásico</Link>
            </Button>
            <Button asChild className="shadow-shape">
              <Link  href={{
                pathname: "/srm",
                query:{
                  voltageBase: voltageBase,
                  potencialBase: potencialBase
                },
            }}
                >Sistema Radial Monofásico</Link>
            </Button>
            <Button asChild className="shadow-shape">
              <Link  href={{
                pathname: "/srt",
                query:{
                  voltageBase: voltageBase,
                  potencialBase: potencialBase
                },
            }}
                >Sistema Radial Trifásico</Link>
            </Button>
          
          </div>
            <h2 className='text-center'>
              <sub>Desenvolvido por <a href="https://github.com/EuduardoP" target="_blank" rel="noreferrer">Eduardo Pires Rosa</a></sub> <br />
              <sub>Dúvidas podem ser resolvidas na <a href="https://github.com/EuduardoP/faultCalculator-App/wiki" target="_blank" className='text-blue-300 underline'>Wiki</a></sub>
            </h2>
          </div>
        </main>
      </div>
    </React.Fragment>
  );
}
