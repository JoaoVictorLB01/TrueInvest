import { Home, Trophy, Target, Clock, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/ranking", icon: Trophy, label: "Ranking" },
  { to: "/metas", icon: Target, label: "Metas" },
  { to: "/ponto", icon: Clock, label: "Ponto" },
  { to: "/perfil", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 shadow-lg z-50 animate-slide-up">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center w-full h-full text-muted-foreground transition-all duration-300 hover:text-gold group press-effect"
            activeClassName="text-gold"
          >
            <div className="relative">
              <item.icon className="h-5 w-5 mb-1 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold opacity-0 group-[.text-gold]:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-xs font-medium transition-all duration-300 group-hover:font-semibold">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
