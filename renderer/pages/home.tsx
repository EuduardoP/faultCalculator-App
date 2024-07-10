import React, { useState } from 'react';
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


export default function HomePage() {
  const [isOpen, setIsOpen] = useState(true);
  const { toast } = useToast();
  const [voltageBase, setVoltageBase] = useState('');
  const [potencialBase, setPotencialBase] = useState('');


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
      <div className='flex flex-col h-screen bg-zinc-600'>
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
        <main className="flex-1 flex justify-center items-center p-4">  
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
        </main>
      </div>
    </React.Fragment>
  );
}
