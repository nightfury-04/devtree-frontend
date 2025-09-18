import { useEffect, useState } from "react";
import { social } from "../data/social";
import DevTreeInput from "../components/DevTreeInput";
import { isValidUrl } from "../utils";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../api/DevTreeAPI";
import type { SocialNetwork, User } from "../types";

export default function LinkTreeView() {
  const [devTreeLinks, setDevTreeLinks] = useState(social);

  const queryClient = useQueryClient();
  const user: User = queryClient.getQueryData(["user"])!;

  const { mutate } = useMutation({
    mutationFn: updateProfile,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Actualizado correctamente");
    },
  });

  useEffect(() => {
    const updatedData = devTreeLinks.map((item) => {
      const userLink = JSON.parse(user.links).find(
        (link: SocialNetwork) => link.name === item.name
      );
      if (userLink) {
        return { ...item, url: userLink.url, enabled: userLink.enabled };
      }
      return item;
    });
    setDevTreeLinks(updatedData);
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedLinks = devTreeLinks.map((link) =>
      link.name === e.target.name ? { ...link, url: e.target.value } : link
    );
    setDevTreeLinks(updatedLinks);

    queryClient.setQueryData(["user"], (prevData: User) => {
      return {
        ...prevData,
        links: JSON.stringify(updatedLinks),
      };
    });
  };

  const links: SocialNetwork[] = JSON.parse(user.links);

  // Validaciones para habilitar o deshabilitar un link
  // 1. La URL debe ser válida
  // 2. Si se habilita, se agrega a la lista de links del usuario
  // 3. Si se deshabilita, se elimina de la lista de links del usuario
  // 4. Al habilitar, se le asigna un id secuencial (1, 2, 3, ...)
  // 5. Al deshabilitar, los ids de los links restantes deben actualizarse para que sigan siendo secuenciales
  const handleEnableLink = (socialNetwork: string) => {
    const updatedLinks = devTreeLinks.map((link) => {
      if (link.name === socialNetwork) {
        if (isValidUrl(link.url)) {
          return { ...link, enabled: !link.enabled };
        } else {
          toast.error("URL no válida");
        }
      }
      return link;
    });
    setDevTreeLinks(updatedLinks);

    let updatedItems: SocialNetwork[] = [];

    const selectedSocialNetwork = updatedLinks.find(
      (link) => link.name === socialNetwork
    );
    if (selectedSocialNetwork?.enabled) {
      const id = links.filter((link) => link.id).length + 1;

      if (links.some((link) => link.name === socialNetwork)) {
        updatedItems = links.map((link) => {
          if (link.name === socialNetwork) {
            return { ...link, enabled: true, id };
          } else {
            return link;
          }
        });
      } else {
        const newItem = {
          ...selectedSocialNetwork,
          id,
        };
        updatedItems = [...links, newItem];
      }
    } else {
      const indexToUpdate = links.findIndex(
        (link) => link.name === socialNetwork
      );
      updatedItems = links.map((link) => {
        if (link.name === socialNetwork) {
          return { ...link, id: 0, enabled: false };
        } else if (link.id > indexToUpdate && (indexToUpdate !== 0 && link.id === 1)) {
          return {
            ...link,
            id: link.id - 1,
          };
        } else {
          return link;
        }
      });
    }

    console.log(updatedItems);

    // Almacenar en la base de datos
    queryClient.setQueryData(["user"], (prevData: User) => {
      return {
        ...prevData,
        links: JSON.stringify(updatedLinks),
      };
    });
  };

  return (
    <div className="space-y-5">
      {devTreeLinks.map((item) => (
        <DevTreeInput
          key={item.name}
          item={item}
          handleUrlChange={handleUrlChange}
          handleEnableLink={handleEnableLink}
        />
      ))}
      <button
        className="bg-cyan-400 p-2 text-lg w-full uppercase text-slate-600 rounded-lg font-bold"
        onClick={() => mutate(queryClient.getQueryData(["user"])!)}
      >
        Guardar Cambios
      </button>
    </div>
  );
}
