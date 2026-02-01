<?php

namespace App\Controller;

use App\Entity\Command;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Csrf\CsrfToken;

class HomeController extends AbstractController
{
    public function __construct(
        private CsrfTokenManagerInterface $csrfTokenManager
    ) {}

    #[Route('/', name: 'app_home')]
    public function index(): Response
    {
        return $this->render('home/index.html.twig', []);
    }

    #[Route('/api/commandes', name: 'api_commandes', methods: ['GET'])]
    public function getCommandes(EntityManagerInterface $em): JsonResponse
    {
        $commands = $em->getRepository(Command::class)->findBy([], ['createdAt' => 'DESC']);

        $data = array_map(fn(Command $cmd) => [
            'id' => $cmd->getId(),
            'description' => $cmd->getDescription(),
            'command' => $cmd->getCommand(),
        ], $commands);

        return new JsonResponse($data, Response::HTTP_OK);
    }

    #[Route('/api/new', name: 'api_commandes_post', methods: ['POST'])]
    public function addCommande(
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        // Validation CSRF
        $token = new CsrfToken('command_form', $data['_csrf_token'] ?? '');
        if (!$this->csrfTokenManager->isTokenValid($token)) {
            return new JsonResponse(['message' => 'Token CSRF invalide'], Response::HTTP_FORBIDDEN);
        }

        // Validation des données
        if (empty($data['description']) || empty($data['command'])) {
            return new JsonResponse(['message' => 'Description et commande requises'], Response::HTTP_BAD_REQUEST);
        }

        $command = new Command();
        $command
            ->setDescription($data['description'])
            ->setCommand($data['command'])
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTime());

        $em->persist($command);
        $em->flush();

        return new JsonResponse([
            'message' => 'Commande ajoutée',
            'id' => $command->getId(),
            'description' => $command->getDescription(),
            'command' => $command->getCommand(),
        ], Response::HTTP_CREATED);
    }

    #[Route('/api/update/{id}', name: 'api_commandes_patch', methods: ['PATCH'])]
    public function updateCommande(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Validation CSRF
        $token = new CsrfToken('command_form', $data['_csrf_token'] ?? '');
        if (!$this->csrfTokenManager->isTokenValid($token)) {
            return new JsonResponse(['message' => 'Token CSRF invalide'], Response::HTTP_FORBIDDEN);
        }

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

        return new JsonResponse([
            'message' => 'Commande mise à jour',
            'id' => $command->getId(),
            'description' => $command->getDescription(),
            'command' => $command->getCommand(),
        ], Response::HTTP_OK);
    }

    #[Route('/api/delete/{id}', name: 'api_commandes_delete', methods: ['DELETE'])]
    public function deleteCommande(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        // Validation CSRF
        $token = new CsrfToken('command_form', $data['_csrf_token'] ?? '');
        if (!$this->csrfTokenManager->isTokenValid($token)) {
            return new JsonResponse(['message' => 'Token CSRF invalide'], Response::HTTP_FORBIDDEN);
        }

        $command = $em->getRepository(Command::class)->find($id);
        if (!$command) {
            return new JsonResponse(['message' => 'Commande non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $em->remove($command);
        $em->flush();

        return new JsonResponse(['message' => 'Commande supprimée'], Response::HTTP_OK);
    }
}
