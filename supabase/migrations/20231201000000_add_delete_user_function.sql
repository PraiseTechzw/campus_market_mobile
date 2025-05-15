-- Function to allow a user to delete their own account (for testing)
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 