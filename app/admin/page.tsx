import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Heading, Table, Tbody, Td, Th, Thead, Tr, Box, Text } from '@chakra-ui/react';
import { useUser } from '@/app/lib/customAuth';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const { user, loading } = useUser();
  const adminEmail = 'noomoaihq@gmail.com';

  useEffect(() => {
    if(!loading && user && user.email === adminEmail) {
      const fetchUsers = async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) console.error('Error fetching users:', error);
        else setUsers(data);
      };
      fetchUsers();
    }
  }, [user, loading]);

  if(loading) return <Text>Loading...</Text>;

  if(!user || user.email !== adminEmail) {
    return <Text>Access Denied</Text>;
  }

  return (
    <Box>
      <Heading size="lg" mb={4}>Admin Dashboard</Heading>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Email</Th>
            <Th>Subscription Tier</Th>
            <Th>Current Tokens</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>{user.email}</Td>
              <Td>{user.subscription_tier}</Td>
              <Td>{user.current_tokens}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
