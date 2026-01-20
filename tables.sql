CREATE POLICY "Enable all access for users based on email" 
ON public.documents
as PERMISSIVE 
FOR ALL 
TO public 
USING (
    (select auth.jwt()) ->> 'email' = email
) 
WITH CHECK (
    (select auth.jwt()) ->> 'email' = email
);