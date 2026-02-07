<?php

namespace App\Controller\Api;

use App\Service\CommandService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Csrf\CsrfToken;

#[Route('/api')]
class ApiController extends AbstractController
{
    public function __construct(
        private CsrfTokenManagerInterface $csrfTokenManager,
        private CommandService $commandService
    ) {}

    #[Route('/commandes', name: 'api_commandes', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $commands = $this->commandService->findAll();

        return new JsonResponse($commands, Response::HTTP_OK);
    }

    #[Route('/new', name: 'api_commandes_post', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$this->isValidCsrfToken($data['_csrf_token'] ?? '')) {
            return new JsonResponse(['message' => 'Token CSRF invalide'], Response::HTTP_FORBIDDEN);
        }

        if (empty($data['description']) || empty($data['command'])) {
            return new JsonResponse(['message' => 'Description et commande requises'], Response::HTTP_BAD_REQUEST);
        }

        $command = $this->commandService->create($data['description'], $data['command']);

        return new JsonResponse([
            'message' => 'Commande ajoutée',
            ...$command,
        ], Response::HTTP_CREATED);
    }

    #[Route('/update/{id}', name: 'api_commandes_patch', methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$this->isValidCsrfToken($data['_csrf_token'] ?? '')) {
            return new JsonResponse(['message' => 'Token CSRF invalide'], Response::HTTP_FORBIDDEN);
        }

        $command = $this->commandService->update(
            $id,
            $data['description'] ?? null,
            $data['command'] ?? null
        );

        if ($command === null) {
            return new JsonResponse(['message' => 'Commande non trouvée'], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse([
            'message' => 'Commande mise à jour',
            ...$command,
        ], Response::HTTP_OK);
    }

    #[Route('/delete/{id}', name: 'api_commandes_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        if (!$this->isValidCsrfToken($data['_csrf_token'] ?? '')) {
            return new JsonResponse(['message' => 'Token CSRF invalide'], Response::HTTP_FORBIDDEN);
        }

        if (!$this->commandService->delete($id)) {
            return new JsonResponse(['message' => 'Commande non trouvée'], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse(['message' => 'Commande supprimée'], Response::HTTP_OK);
    }

    private function isValidCsrfToken(string $tokenValue): bool
    {
        $token = new CsrfToken('command_form', $tokenValue);
        return $this->csrfTokenManager->isTokenValid($token);
    }
}
