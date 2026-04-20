import axios from 'axios';
import { apiBaseUrl } from '../config/api';

const api = axios.create({
    baseURL: apiBaseUrl
})

export default api
