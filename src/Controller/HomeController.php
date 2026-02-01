<?php

namespace App\Controller;

use Dom\Entity;
use App\Entity\Command;
use App\Form\CommandType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class HomeController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function index(): Response
    {
        return $this->render('home/index.html.twig', []);
    }

    // route en GET retournant les commandes depuis le fichier JSON
    // TODO: à implémenter
    #[Route('/api/commandes', name: 'api_commandes', methods: ['GET'])]
    public function getCommandes(): JsonResponse
    {
        $json = file_get_contents('../public/fake_commands.json');
        $commandes = json_decode($json, true) ?: [];

        return new JsonResponse($commandes, Response::HTTP_OK, []);
    }

    // route en POST pour ajouter une commande
    #[Route('/api/new', name: 'api_commandes_post', methods: ['POST'])]
    public function addCommande(
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {

        // TODO ajouter la gesiton du csrftoken avec le csrf_protected_controller

        // on récupère les données sur POST et on crée une nouvelle Command
        $data = json_decode($request->getContent(), true);

        $command = new Command();
        $command
            ->setDescription($data['description'] ?? '')
            ->setCommand($data['command'] ?? '')
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTime());

        $em->persist($command);
        $em->flush();

        return new JsonResponse(['message' => 'Commande ajoutée ' . $command->getId()], Response::HTTP_CREATED);
    }

    // route en PATCH pour mettre à jour une commande
    #[Route('/api/update/{id}', name: 'api_commandes_patch', methods: ['PATCH'])]
    public function updateCommande(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        // TODO ajouter la gesiton du csrftoken avec le csrf_protected_controller

        $data = json_decode($request->getContent(), true);
        // voir si le param converter a pas déjà récupèré l'entité sur l'id
        // si oui on fait pas le find manuellement
        $command = $em->getRepository(Command::class)->find($id);
        if (!$command) {
            return new JsonResponse(['message' => 'Commande non trouvée'], Response::HTTP_NOT_FOUND);
        }

        if (isset($data['description'])) {
            $command->setDescription($data['description']);
        }
        if (isset($data['command'])) {
            $command->setCommand($data['command']);
        }
        $command->setUpdatedAt(new \DateTime());
        $em->flush();

        // TODO Rafraîchir la liste des commandes côté client via JS (fetch)
        return new JsonResponse(['message' => "Commande $id mise à jour"], Response::HTTP_OK);
    }

    // route en DELETE pour supprimer une commande
    // je mettrait directement un basic auth sur Caddyfile pour sécuriser cette route
    // directement au niveau du serveur web...
    #[Route('/api/delete/{id}', name: 'api_commandes_delete', methods: ['DELETE'])]
    public function deleteCommande(int $id, EntityManagerInterface $em): JsonResponse
    {
        // TODO ajouter la gesiton du csrftoken avec le csrf_protected_controller
        $command = $em->getRepository(Command::class)->find($id);
        if (!$command) {
            return new JsonResponse(['message' => 'Commande non trouvée'], Response::HTTP_NOT_FOUND);
        }
        $em->remove($command);
        $em->flush();

        // Logique pour supprimer une commande
        // TODO Rafraîchir la liste des commandes côté client via JS (fetch)
        return new JsonResponse(['message' => "Commande $id supprimée"], Response::HTTP_OK);
    }
}
