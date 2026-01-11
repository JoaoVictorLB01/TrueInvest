export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      atividades: {
        Row: {
          cliente_contato: string | null
          cliente_nome: string | null
          created_at: string | null
          data_hora: string
          descricao: string | null
          id: string
          pontos_ganhos: number | null
          status: string | null
          tipo: string
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cliente_contato?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_hora: string
          descricao?: string | null
          id?: string
          pontos_ganhos?: number | null
          status?: string | null
          tipo: string
          titulo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cliente_contato?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_hora?: string
          descricao?: string | null
          id?: string
          pontos_ganhos?: number | null
          status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conquistas: {
        Row: {
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          pontos_recompensa: number | null
          requisito_tipo: string | null
          requisito_valor: number | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          pontos_recompensa?: number | null
          requisito_tipo?: string | null
          requisito_valor?: number | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          pontos_recompensa?: number | null
          requisito_tipo?: string | null
          requisito_valor?: number | null
          titulo?: string
        }
        Relationships: []
      }
      metas: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          periodo: string
          pontos_recompensa: number
          tipo: string
          titulo: string
          valor_objetivo: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          periodo?: string
          pontos_recompensa: number
          tipo: string
          titulo: string
          valor_objetivo: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          periodo?: string
          pontos_recompensa?: number
          tipo?: string
          titulo?: string
          valor_objetivo?: number
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          created_at: string | null
          id: string
          lida: boolean | null
          mensagem: string | null
          referencia_id: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          mensagem?: string | null
          referencia_id?: string | null
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          mensagem?: string | null
          referencia_id?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          foto: string | null
          id: string
          nome: string
          pontos_totais: number | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          foto?: string | null
          id: string
          nome: string
          pontos_totais?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          foto?: string | null
          id?: string
          nome?: string
          pontos_totais?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      progresso_metas: {
        Row: {
          completada: boolean | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          id: string
          meta_id: string
          updated_at: string | null
          user_id: string
          valor_atual: number | null
        }
        Insert: {
          completada?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          meta_id: string
          updated_at?: string | null
          user_id: string
          valor_atual?: number | null
        }
        Update: {
          completada?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          meta_id?: string
          updated_at?: string | null
          user_id?: string
          valor_atual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progresso_metas_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_ponto: {
        Row: {
          created_at: string | null
          entrada: string
          id: string
          localizacao_entrada: string | null
          localizacao_saida: string | null
          saida: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entrada: string
          id?: string
          localizacao_entrada?: string | null
          localizacao_saida?: string | null
          saida?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entrada?: string
          id?: string
          localizacao_entrada?: string | null
          localizacao_saida?: string | null
          saida?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reunioes: {
        Row: {
          created_at: string | null
          created_by: string
          data_hora: string
          descricao: string | null
          id: string
          link: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          data_hora: string
          descricao?: string | null
          id?: string
          link?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          data_hora?: string
          descricao?: string | null
          id?: string
          link?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_conquistas: {
        Row: {
          conquista_id: string
          desbloqueada_em: string | null
          id: string
          user_id: string
        }
        Insert: {
          conquista_id: string
          desbloqueada_em?: string | null
          id?: string
          user_id: string
        }
        Update: {
          conquista_id?: string
          desbloqueada_em?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conquistas_conquista_id_fkey"
            columns: ["conquista_id"]
            isOneToOne: false
            referencedRelation: "conquistas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          cliente_nome: string | null
          comissao: number | null
          created_at: string | null
          data_venda: string
          id: string
          imovel_nome: string
          pontos_ganhos: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          cliente_nome?: string | null
          comissao?: number | null
          created_at?: string | null
          data_venda?: string
          id?: string
          imovel_nome: string
          pontos_ganhos?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          cliente_nome?: string | null
          comissao?: number | null
          created_at?: string | null
          data_venda?: string
          id?: string
          imovel_nome?: string
          pontos_ganhos?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "corretor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "corretor"],
    },
  },
} as const
