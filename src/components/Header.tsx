import { Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  return (
    <header className="bg-gradient-primary text-white p-6 pb-8 rounded-b-[2rem] animate-slide-down">
      <div className="flex justify-between items-start mb-6 opacity-0-animate animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-gold hover-scale cursor-pointer animate-bounce-in">
            <span className="text-lg font-bold text-primary">TI</span>
          </div>
          <span className="text-lg font-bold animate-slide-right delay-100">True Invest</span>
        </div>
        <button className="relative p-2 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110 press-effect group">
          <Bell className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full animate-pulse-soft"></span>
        </button>
      </div>
      
      <div className="opacity-0-animate animate-slide-up delay-200">
        <h1 className="text-2xl font-bold mb-1">{title}</h1>
        {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
      </div>
    </header>
  );
};

export default Header;
