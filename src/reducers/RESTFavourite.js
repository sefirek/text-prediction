import axios from "axios";
import { getHost } from '../webWorker/config.mjs';

export async function getFavourites(){
    return axios.get(`${getHost()}/favourite`).then(res=>res.data)
}

export async function addFavourite(market) {
    return axios.post(`${getHost()}/favourite`, {market}).then(res=>res.data)
}

export async function deleteFavourite(market) {
    return axios.delete(`${getHost()}/favourite`, { data: { market }}).then(res=>res.data);
}

export default {getFavourites, addFavourite, deleteFavourite};