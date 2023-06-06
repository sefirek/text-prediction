import axios from "axios";
import { getHost } from '../webWorker/config.mjs';

export async function getFavourites(){
    return axios.get(`${getHost()}/favourites`).then(res=>res.data)
}

export async function addFavourite(market) {
    return axios.post(`${getHost()}/favourites`, {market}).then(res=>res.data)
}

export async function deleteFavourite(market) {
    return axios.delete(`${getHost()}/favourites`, { data: { market }}).then(res=>res.data);
}

export default {getFavourites, addFavourite, deleteFavourite};