import { UserContext } from '../../components/UserProvider';

const useLoggedInUser = () => React.useContext(UserContext);

export default useLoggedInUser;
