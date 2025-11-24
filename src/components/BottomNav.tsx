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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center w-full h-full text-muted-foreground transition-smooth hover:text-gold"
            activeClassName="text-gold"
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
