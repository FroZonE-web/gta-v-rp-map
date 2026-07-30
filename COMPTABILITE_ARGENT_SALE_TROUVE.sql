create or replace function public.create_simple_accounting_operation(p_operation text,p_amount numeric,p_recipient text default null,p_label text default null)
returns void language plpgsql security definer set search_path=public as $$
declare v_balance numeric;
begin
 if p_amount is null or p_amount<=0 then raise exception 'Montant invalide'; end if;
 select coalesce(sum(case when direction='credit' then amount else -amount end),0) into v_balance from accounting_transactions where account='club' and money_type='clean';
 case p_operation
  when 'quick_income' then insert into accounting_transactions(account,money_type,direction,operation_type,title,amount,label) values('club','clean','credit','quick_income','Recette rapide',p_amount,p_label);
  when 'quick_dirty_income' then insert into accounting_transactions(account,money_type,direction,operation_type,title,amount,label) values('club','dirty','credit','quick_dirty_income','Argent sale trouvé',p_amount,coalesce(p_label,'Argent sale trouvé'));
  when 'member_payment' then if v_balance<p_amount then raise exception 'Solde propre insuffisant'; end if; insert into accounting_transactions(account,money_type,direction,operation_type,title,amount,counterparty,label) values('club','clean','debit','member_payment','Paiement à un membre',p_amount,p_recipient,p_label);
  when 'black_transfer' then if v_balance<p_amount then raise exception 'Solde propre insuffisant'; end if; insert into accounting_transactions(account,money_type,direction,operation_type,title,amount,counterparty,label) values('club','clean','debit','black_transfer_out','Transfert vers la caisse noire',p_amount,'Caisse noire',p_label); insert into accounting_transactions(account,money_type,direction,operation_type,title,amount,counterparty,label) values('black','clean','credit','black_transfer_in','Ajout à la caisse noire',p_amount,'Compte du club',p_label);
  when 'black_deposit' then insert into accounting_transactions(account,money_type,direction,operation_type,title,amount,label) values('black','clean','credit','black_deposit','Ajout à la caisse noire',p_amount,p_label);
  when 'black_withdrawal' then select coalesce(sum(case when direction='credit' then amount else -amount end),0) into v_balance from accounting_transactions where account='black'; if v_balance<p_amount then raise exception 'Solde caisse noire insuffisant'; end if; if coalesce(trim(p_label),'')='' then raise exception 'La raison est obligatoire'; end if; insert into accounting_transactions(account,money_type,direction,operation_type,title,amount,label) values('black','clean','debit','black_withdrawal','Retrait de la caisse noire',p_amount,p_label);
  else raise exception 'Opération inconnue';
 end case;
end;$$;
grant execute on function public.create_simple_accounting_operation(text,numeric,text,text) to anon,authenticated;
